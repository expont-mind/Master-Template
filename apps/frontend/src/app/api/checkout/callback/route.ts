import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { callerIp, isJsonRequest, rateLimit, safeJson } from "@/lib/api/callback-guards";
import { logPaymentEvent } from "@/lib/payment-logger";
import { checkPayment } from "@/lib/qpay/client";
import { resolvePaymentWallet } from "@/lib/qpay/utils";
import { log } from "@/lib/utils/logger";

import type { Database } from "@/types/database";

// Use service role for callback — no user session available
function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type AdminSupabaseClient = ReturnType<typeof getAdminClient>;
type CheckPaymentResult = Awaited<ReturnType<typeof checkPayment>>;

async function confirmPaidInvoice(
  invoiceId: string,
  result: CheckPaymentResult,
): Promise<{ ok: true } | { ok: false; status: number }> {
  const payment = result.payments?.[0];
  const paidAmount = payment ? parseFloat(payment.amount) : 0;
  if (!payment || paidAmount <= 0) return { ok: true };

  const supabase: AdminSupabaseClient = getAdminClient();

  const { error: updateError } = await supabase
    .from("payment_invoices")
    .update({
      status: "paid",
      paid_amount: paidAmount,
      transaction_id: payment.transactions?.[0]?.id ?? null,
      payment_wallet: resolvePaymentWallet(payment),
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  if (updateError) {
    log.error("qpay_callback_invoice_update_failed", {
      error: updateError,
      invoiceId,
    });
    await logPaymentEvent({
      invoiceId,
      provider: "qpay",
      event: "invoice_update_failed",
      message: updateError.message,
    });
    return { ok: false, status: 500 };
  }

  // Update order status (idempotent — safe to call multiple times)
  const { data: rpcData, error: rpcError } = await supabase.rpc("create_order_from_invoice", {
    p_invoice_id: invoiceId,
  });
  if (rpcError) {
    log.error("qpay_callback_rpc_error", { error: rpcError, invoiceId });
    await logPaymentEvent({
      invoiceId,
      provider: "qpay",
      event: "rpc_error",
      message: rpcError.message,
    });
    return { ok: false, status: 500 };
  }

  const rpcResult = rpcData as { success: boolean; error?: string } | null;
  if (rpcResult && !rpcResult.success) {
    log.error("qpay_callback_rpc_failure", {
      error: rpcResult.error,
      invoiceId,
    });
    await logPaymentEvent({
      invoiceId,
      provider: "qpay",
      event: "rpc_failure",
      message: rpcResult.error,
    });
    return { ok: false, status: 500 };
  }

  await logPaymentEvent({
    invoiceId,
    provider: "qpay",
    event: "order_confirmed",
    status: "success",
    metadata: { paidAmount, wallet: resolvePaymentWallet(payment) },
  });
  return { ok: true };
}

export async function POST(req: NextRequest) {
  try {
    if (!isJsonRequest(req)) {
      return NextResponse.json(
        { success: false, error: "expected application/json" },
        { status: 400 },
      );
    }

    // Rate limit by caller IP. QPay legitimately retries failed callbacks
    // every ~30s; 30 req/min/IP gives plenty of headroom while killing
    // floods. Keyed per-route so QPay and LendMN limits don't share.
    const limit = await rateLimit(`rl:callback:qpay:${callerIp(req)}`);
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, error: "rate limited" },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        },
      );
    }

    const body = await safeJson<{ invoice_id?: string | null }>(req);
    if (!body) {
      return NextResponse.json({ success: false, error: "invalid json" }, { status: 400 });
    }

    const invoiceId = body.invoice_id;

    if (!invoiceId || typeof invoiceId !== "string") {
      return NextResponse.json({ success: true });
    }

    await logPaymentEvent({
      invoiceId,
      provider: "qpay",
      event: "callback_received",
      status: "info",
    });

    // Verify payment independently with QPay
    const result = await checkPayment(invoiceId);
    if (result.invoice_status !== "PAID") {
      return NextResponse.json({ success: true });
    }

    const outcome = await confirmPaidInvoice(invoiceId, result);
    if (!outcome.ok) {
      return NextResponse.json({ success: false }, { status: outcome.status });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    log.error("qpay_callback_unhandled_error", err);
    await logPaymentEvent({
      provider: "qpay",
      event: "callback_unhandled_error",
      message: err instanceof Error ? err.message : String(err),
    });
    // Return 500 so QPay retries the callback
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
