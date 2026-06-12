import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { callerIp, isJsonRequest, rateLimit, safeJson } from "@/lib/api/callback-guards";
import { getLendMNInvoiceStatus } from "@/lib/lendmn/client";
import { logPaymentEvent } from "@/lib/payment-logger";
import { log } from "@/lib/utils/logger";

import type { Database } from "@/types/database";

type AdminClient = ReturnType<typeof createClient<Database>>;
type InvoiceRow = {
  id: string;
  status: string;
  order_id: string | null;
};

function getAdminClient(): AdminClient {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const ok = () => NextResponse.json({ success: true });
const fail = () => NextResponse.json({ success: false }, { status: 500 });

interface LendMnBody {
  invoiceNumber?: string | null;
  invoice_number?: string | null;
  InvoiceNumber?: string | null;
  data?: { invoiceNumber?: string | null } | null;
}

function extractInvoiceNumber(body: LendMnBody): string | null {
  const candidate =
    body.invoiceNumber ?? body.invoice_number ?? body.InvoiceNumber ?? body.data?.invoiceNumber;
  return typeof candidate === "string" && candidate ? candidate : null;
}

async function preflight(req: NextRequest): Promise<NextResponse | { invoiceNumber: string }> {
  if (!isJsonRequest(req)) {
    return NextResponse.json(
      { success: false, error: "expected application/json" },
      { status: 400 },
    );
  }

  const limit = await rateLimit(`rl:callback:lendmn:${callerIp(req)}`);
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, error: "rate limited" },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  const body = await safeJson<LendMnBody>(req);
  if (!body) {
    return NextResponse.json({ success: false, error: "invalid json" }, { status: 400 });
  }

  const invoiceNumber = extractInvoiceNumber(body);
  // Bad/missing invoiceNumber is treated as a no-op `ok()` — LendMN's
  // callback shape varies and we don't want them to retry forever.
  if (!invoiceNumber) return ok();
  return { invoiceNumber };
}

/**
 * Runs the create_order_from_invoice RPC and logs every failure
 * branch. `eventPrefix` differentiates first-run vs retry telemetry.
 */
async function runCreateOrderRpc(
  supabase: AdminClient,
  invoice: InvoiceRow,
  invoiceNumber: string,
  eventPrefix: "rpc" | "rpc_retry",
): Promise<NextResponse | null> {
  const { data: rpcData, error: rpcError } = await supabase.rpc("create_order_from_invoice", {
    p_invoice_id: invoice.id,
  });

  if (rpcError) {
    log.error(`lendmn_callback_${eventPrefix}_error`, { error: rpcError, invoiceNumber });
    await logPaymentEvent({
      invoiceId: invoice.id,
      orderId: invoice.order_id,
      provider: "lendmn",
      event: `${eventPrefix}_error`,
      message: rpcError.message,
    });
    return fail();
  }

  const rpcResult = rpcData as { success: boolean; error?: string } | null;
  if (rpcResult && !rpcResult.success) {
    log.error(`lendmn_callback_${eventPrefix}_failure`, {
      error: rpcResult.error,
      invoiceNumber,
    });
    await logPaymentEvent({
      invoiceId: invoice.id,
      orderId: invoice.order_id,
      provider: "lendmn",
      event: `${eventPrefix}_failure`,
      message: rpcResult.error,
    });
    return fail();
  }

  return null;
}

async function isOrderAlreadyConfirmed(supabase: AdminClient, orderId: string): Promise<boolean> {
  const { data: order } = await supabase
    .from("orders")
    .select("status, payment_status")
    .eq("id", orderId)
    .single();
  return order?.status === "confirmed" && order?.payment_status === "paid";
}

/**
 * The invoice is already marked `paid` in our DB. If the order is also
 * confirmed, this is a duplicate callback — short-circuit. Otherwise we
 * had a prior RPC failure; retry now.
 */
async function handleAlreadyPaidInvoice(
  supabase: AdminClient,
  invoice: InvoiceRow,
  invoiceNumber: string,
): Promise<NextResponse> {
  if (invoice.order_id && (await isOrderAlreadyConfirmed(supabase, invoice.order_id))) {
    return ok();
  }

  await logPaymentEvent({
    invoiceId: invoice.id,
    orderId: invoice.order_id,
    provider: "lendmn",
    event: "rpc_retry",
    status: "info",
    message: "Invoice paid but order not confirmed, retrying RPC",
  });

  const rpcResp = await runCreateOrderRpc(supabase, invoice, invoiceNumber, "rpc_retry");
  if (rpcResp) return rpcResp;

  await logPaymentEvent({
    invoiceId: invoice.id,
    orderId: invoice.order_id,
    provider: "lendmn",
    event: "order_confirmed_on_retry",
    status: "success",
  });
  return ok();
}

/**
 * The invoice was previously `pending` and just confirmed paid with
 * LendMN. Persist the new status, then create the order.
 */
async function confirmAndCreateOrder(
  supabase: AdminClient,
  invoice: InvoiceRow,
  invoiceNumber: string,
  amount: number | null | undefined,
): Promise<NextResponse> {
  const { error: updateError } = await supabase
    .from("payment_invoices")
    .update({
      status: "paid",
      paid_amount: amount ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoice.id);

  if (updateError) {
    log.error("lendmn_callback_invoice_update_failed", { error: updateError, invoiceNumber });
    await logPaymentEvent({
      invoiceId: invoice.id,
      provider: "lendmn",
      event: "invoice_update_failed",
      message: updateError.message,
    });
    return fail();
  }

  const rpcResp = await runCreateOrderRpc(supabase, invoice, invoiceNumber, "rpc");
  if (rpcResp) return rpcResp;

  await logPaymentEvent({
    invoiceId: invoice.id,
    orderId: invoice.order_id,
    provider: "lendmn",
    event: "order_confirmed",
    status: "success",
    metadata: { amount },
  });
  return ok();
}

export async function POST(req: NextRequest) {
  try {
    const pre = await preflight(req);
    if (pre instanceof NextResponse) return pre;
    const { invoiceNumber } = pre;

    await logPaymentEvent({
      provider: "lendmn",
      event: "callback_received",
      status: "info",
      metadata: { invoiceNumber },
    });

    // Verify payment status directly with LendMN API
    const result = await getLendMNInvoiceStatus(invoiceNumber);
    if (!result.paid) return ok();

    const supabase = getAdminClient();

    const { data: invoice, error: findError } = await supabase
      .from("payment_invoices")
      .select("id, status, order_id")
      .eq("external_invoice_number", invoiceNumber)
      .eq("provider", "lendmn")
      .single();

    if (findError || !invoice) {
      log.error("lendmn_callback_invoice_not_found", { invoiceNumber, findError });
      await logPaymentEvent({
        provider: "lendmn",
        event: "invoice_not_found",
        message: findError?.message ?? "No matching invoice",
        metadata: { invoiceNumber },
      });
      return fail();
    }

    if (invoice.status === "paid") {
      return handleAlreadyPaidInvoice(supabase, invoice, invoiceNumber);
    }

    return confirmAndCreateOrder(supabase, invoice, invoiceNumber, result.amount);
  } catch (err) {
    log.error("lendmn_callback_unhandled_error", err);
    await logPaymentEvent({
      provider: "lendmn",
      event: "callback_unhandled_error",
      message: err instanceof Error ? err.message : String(err),
    });
    return fail();
  }
}
