import { logPaymentEvent } from "@/lib/payment-logger";
import { log } from "@/lib/utils/logger";

import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

type Admin = SupabaseClient<Database>;

export interface InvoiceRow {
  id: string;
  status: string | null;
  order_id: string | null;
}

/** Look up the payment_invoices row by external loan id + provider. */
export async function findInvoiceByLoanId(
  supabase: Admin,
  loanId: string,
): Promise<InvoiceRow | null> {
  const { data: invoice, error: findError } = await supabase
    .from("payment_invoices")
    .select("id, status, order_id")
    .eq("external_invoice_number", loanId)
    .eq("provider", "storepay")
    .single();

  if (findError || !invoice) {
    log.error("storepay_callback_invoice_not_found", { loanId, findError });
    await logPaymentEvent({
      provider: "storepay",
      event: "invoice_not_found",
      message: findError?.message ?? "No matching invoice",
      metadata: { loanId },
    });
    return null;
  }

  return invoice;
}

/** Returns true when the linked order is fully confirmed+paid. */
export async function isOrderFullyConfirmed(
  supabase: Admin,
  orderId: string | null,
): Promise<boolean> {
  if (!orderId) return false;
  const { data: order } = await supabase
    .from("orders")
    .select("status, payment_status")
    .eq("id", orderId)
    .single();
  return order?.status === "confirmed" && order?.payment_status === "paid";
}

/** Run the create_order_from_invoice RPC. Returns "ok" / "error" / "failure". */
export async function runCreateOrderRpc(
  supabase: Admin,
  invoice: InvoiceRow,
  loanId: string,
  variant: "retry" | "initial",
): Promise<{ ok: true } | { ok: false }> {
  const { data: rpcData, error: rpcError } = await supabase.rpc("create_order_from_invoice", {
    p_invoice_id: invoice.id,
  });

  if (rpcError) {
    const evt =
      variant === "retry" ? "storepay_callback_rpc_retry_error" : "storepay_callback_rpc_error";
    log.error(evt, { error: rpcError, loanId });
    await logPaymentEvent({
      invoiceId: invoice.id,
      orderId: invoice.order_id,
      provider: "storepay",
      event: variant === "retry" ? "rpc_retry_error" : "rpc_error",
      message: rpcError.message,
    });
    return { ok: false };
  }

  const result = rpcData as { success: boolean; error?: string } | null;
  if (result && !result.success) {
    const evt =
      variant === "retry" ? "storepay_callback_rpc_retry_failure" : "storepay_callback_rpc_failure";
    log.error(evt, { error: result.error, loanId });
    await logPaymentEvent({
      invoiceId: invoice.id,
      orderId: invoice.order_id,
      provider: "storepay",
      event: variant === "retry" ? "rpc_retry_failure" : "rpc_failure",
      message: result.error,
    });
    return { ok: false };
  }

  return { ok: true };
}

/** Mark the invoice paid in our DB. Returns ok status. */
export async function markInvoicePaid(
  supabase: Admin,
  invoice: InvoiceRow,
  loanId: string,
  paidAmount: number | null,
): Promise<{ ok: true } | { ok: false }> {
  const { error: updateError } = await supabase
    .from("payment_invoices")
    .update({
      status: "paid",
      paid_amount: paidAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoice.id);

  if (updateError) {
    log.error("storepay_callback_invoice_update_failed", {
      error: updateError,
      loanId,
    });
    await logPaymentEvent({
      invoiceId: invoice.id,
      provider: "storepay",
      event: "invoice_update_failed",
      message: updateError.message,
    });
    return { ok: false };
  }
  return { ok: true };
}
