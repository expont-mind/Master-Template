import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStorePayInvoiceStatus } from "@/lib/storepay/client";
import { logPaymentEvent } from "@/lib/payment-logger";
import type { Database } from "@/types/database";

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const ok = () => NextResponse.json({ success: true });

export async function GET(req: NextRequest) {
  try {
    // StorePay sends callback as GET with ?id=loanId
    const loanId = req.nextUrl.searchParams.get("id");

    if (!loanId) {
      return ok();
    }

    return await handleCallback(loanId);
  } catch (err) {
    console.error("[storepay-callback] Unhandled error:", err);
    await logPaymentEvent({
      provider: "storepay",
      event: "callback_unhandled_error",
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const loanId =
      body.id ?? body.loanId ?? body.loan_id ?? req.nextUrl.searchParams.get("id");

    if (!loanId) {
      return ok();
    }

    return await handleCallback(String(loanId));
  } catch (err) {
    console.error("[storepay-callback] Unhandled error:", err);
    await logPaymentEvent({
      provider: "storepay",
      event: "callback_unhandled_error",
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

async function handleCallback(loanId: string) {
  await logPaymentEvent({
    provider: "storepay",
    event: "callback_received",
    status: "info",
    metadata: { loanId },
  });

  // Verify payment status directly with StorePay API
  const result = await getStorePayInvoiceStatus(loanId);

  if (!result.paid) {
    return ok();
  }

  const supabase = getAdminClient();

  // Find invoice by external_invoice_number + provider
  const { data: invoice, error: findError } = await supabase
    .from("payment_invoices")
    .select("id, status, order_id")
    .eq("external_invoice_number", loanId)
    .eq("provider", "storepay")
    .single();

  if (findError || !invoice) {
    console.error("[storepay-callback] Invoice not found:", { loanId, findError });
    await logPaymentEvent({
      provider: "storepay",
      event: "invoice_not_found",
      message: findError?.message ?? "No matching invoice",
      metadata: { loanId },
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }

  if (invoice.status === "paid") {
    // Invoice already paid — but check if order was actually confirmed
    if (invoice.order_id) {
      const { data: order } = await supabase
        .from("orders")
        .select("status, payment_status")
        .eq("id", invoice.order_id)
        .single();

      if (order?.status === "confirmed" && order?.payment_status === "paid") {
        return ok(); // Fully processed
      }
    }

    // Invoice paid but order not confirmed — retry RPC
    await logPaymentEvent({
      invoiceId: invoice.id,
      orderId: invoice.order_id,
      provider: "storepay",
      event: "rpc_retry",
      status: "info",
      message: "Invoice paid but order not confirmed, retrying RPC",
    });

    const { data: retryRpcData, error: rpcError } = await supabase.rpc("create_order_from_invoice", {
      p_invoice_id: invoice.id,
    });

    if (rpcError) {
      console.error("[storepay-callback] RPC retry error:", rpcError, { loanId });
      await logPaymentEvent({
        invoiceId: invoice.id,
        orderId: invoice.order_id,
        provider: "storepay",
        event: "rpc_retry_error",
        message: rpcError.message,
      });
      return NextResponse.json({ success: false }, { status: 500 });
    }

    const retryResult = retryRpcData as { success: boolean; error?: string } | null;
    if (retryResult && !retryResult.success) {
      console.error("[storepay-callback] RPC retry failure:", retryResult.error, { loanId });
      await logPaymentEvent({
        invoiceId: invoice.id,
        orderId: invoice.order_id,
        provider: "storepay",
        event: "rpc_retry_failure",
        message: retryResult.error,
      });
      return NextResponse.json({ success: false }, { status: 500 });
    }

    await logPaymentEvent({
      invoiceId: invoice.id,
      orderId: invoice.order_id,
      provider: "storepay",
      event: "order_confirmed_on_retry",
      status: "success",
    });

    return ok();
  }

  // Update invoice status
  const { error: updateError } = await supabase
    .from("payment_invoices")
    .update({
      status: "paid",
      paid_amount: result.amount ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoice.id);

  if (updateError) {
    console.error("[storepay-callback] Invoice update error:", updateError, { loanId });
    await logPaymentEvent({
      invoiceId: invoice.id,
      provider: "storepay",
      event: "invoice_update_failed",
      message: updateError.message,
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }

  // Create order server-side (idempotent)
  const { data: rpcData, error: rpcError2 } = await supabase.rpc("create_order_from_invoice", {
    p_invoice_id: invoice.id,
  });

  if (rpcError2) {
    console.error("[storepay-callback] RPC error:", rpcError2, { loanId });
    await logPaymentEvent({
      invoiceId: invoice.id,
      orderId: invoice.order_id,
      provider: "storepay",
      event: "rpc_error",
      message: rpcError2.message,
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }

  const rpcResult = rpcData as { success: boolean; error?: string } | null;
  if (rpcResult && !rpcResult.success) {
    console.error("[storepay-callback] RPC failure:", rpcResult.error, { loanId });
    await logPaymentEvent({
      invoiceId: invoice.id,
      orderId: invoice.order_id,
      provider: "storepay",
      event: "rpc_failure",
      message: rpcResult.error,
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }

  await logPaymentEvent({
    invoiceId: invoice.id,
    orderId: invoice.order_id,
    provider: "storepay",
    event: "order_confirmed",
    status: "success",
    metadata: { amount: result.amount },
  });

  return ok();
}
