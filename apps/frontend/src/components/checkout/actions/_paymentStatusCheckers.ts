// Per-provider invoice status checkers used by `checkPaymentStatus`. Each
// returns the same `PaymentStatusResult` shape so the public action stays
// a thin dispatcher. Not a "use server" module — these are called from the
// action which already runs server-side.

import { getLendMNInvoiceStatus } from "@/lib/lendmn/client";
import { logPaymentEvent } from "@/lib/payment-logger";
import { checkPayment } from "@/lib/qpay/client";
import { resolvePaymentWallet } from "@/lib/qpay/utils";
import { getStorePayInvoiceStatus } from "@/lib/storepay/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/logger";

export type PaymentStatusResult =
  | { success: true; paid: boolean }
  | { success: false; error: string };

type Admin = ReturnType<typeof createAdminClient>;

/** Look up the external invoice number we stored on payment_invoices. */
async function findExternalNumber(
  admin: Admin,
  invoiceId: string,
  provider: "lendmn" | "storepay",
): Promise<string | null> {
  const { data: inv } = await admin
    .from("payment_invoices")
    .select("external_invoice_number")
    .eq("id", invoiceId)
    .eq("provider", provider)
    .single();
  return inv?.external_invoice_number ?? null;
}

async function markInvoicePaid(
  admin: Admin,
  invoiceId: string,
  paidAmount: number | null,
): Promise<void> {
  await admin
    .from("payment_invoices")
    .update({
      status: "paid",
      paid_amount: paidAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);
}

async function createOrderFromInvoiceSafely(
  admin: Admin,
  invoiceId: string,
  provider: "lendmn" | "storepay" | "qpay",
): Promise<void> {
  try {
    const { error: rpcErr } = await admin.rpc("create_order_from_invoice", {
      p_invoice_id: invoiceId,
    });
    if (rpcErr) {
      log.error(`payment_check_${provider}_rpc_error`, { error: rpcErr, invoiceId });
      logPaymentEvent({
        invoiceId,
        provider,
        event: "poll_rpc_error",
        message: rpcErr.message,
      });
    }
  } catch (e) {
    log.error(`payment_check_${provider}_db_rpc_error`, { error: e, invoiceId });
    logPaymentEvent({
      invoiceId,
      provider,
      event: "poll_db_rpc_error",
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function checkLendMNStatus(invoiceId: string): Promise<PaymentStatusResult> {
  try {
    const admin = createAdminClient();
    const externalNumber = await findExternalNumber(admin, invoiceId, "lendmn");
    if (!externalNumber) return { success: true, paid: false };

    const result = await getLendMNInvoiceStatus(externalNumber);
    if (!result.paid) return { success: true, paid: false };

    await markInvoicePaid(admin, invoiceId, result.amount ?? null);
    await admin.rpc("create_order_from_invoice", { p_invoice_id: invoiceId });
    return { success: true, paid: true };
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : "unknown";
    log.error("payment_check_lendmn_error", { message: rawMsg });
    logPaymentEvent({
      invoiceId,
      provider: "lendmn",
      event: "poll_check_error",
      message: rawMsg,
    });
    return { success: false, error: "LendMN төлбөр шалгахад алдаа гарлаа" };
  }
}

export async function checkStorePayStatus(invoiceId: string): Promise<PaymentStatusResult> {
  try {
    const admin = createAdminClient();
    const externalNumber = await findExternalNumber(admin, invoiceId, "storepay");
    if (!externalNumber) return { success: true, paid: false };

    const result = await getStorePayInvoiceStatus(externalNumber);
    if (!result.paid) return { success: true, paid: false };

    try {
      await markInvoicePaid(admin, invoiceId, result.amount ?? null);
      await createOrderFromInvoiceSafely(admin, invoiceId, "storepay");
    } catch (e) {
      log.error("payment_check_storepay_db_rpc_error", { error: e, invoiceId });
      logPaymentEvent({
        invoiceId,
        provider: "storepay",
        event: "poll_db_rpc_error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
    return { success: true, paid: true };
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : "unknown";
    log.error("payment_check_storepay_error", { message: rawMsg });
    logPaymentEvent({
      invoiceId,
      provider: "storepay",
      event: "poll_check_error",
      message: rawMsg,
    });
    return { success: false, error: "StorePay төлбөр шалгахад алдаа гарлаа" };
  }
}

type QPayPayment = NonNullable<Awaited<ReturnType<typeof checkPayment>>["payments"]>[number];

async function finalizeQPayPayment(
  invoiceId: string,
  payment: QPayPayment | undefined,
  paidAmount: number,
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin
      .from("payment_invoices")
      .update({
        status: "paid",
        paid_amount: paidAmount,
        transaction_id: payment?.transactions?.[0]?.id ?? null,
        payment_wallet: payment ? resolvePaymentWallet(payment) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    try {
      await admin.rpc("create_order_from_invoice", { p_invoice_id: invoiceId });
    } catch {
      /* non-blocking; other paths will retry */
    }
  } catch {
    // DB update failed — not critical, payment is confirmed
  }
}

export async function checkQPayStatus(invoiceId: string): Promise<PaymentStatusResult> {
  try {
    const result = await checkPayment(invoiceId);
    const isPaid = result.invoice_status === "PAID";
    const payment = result.payments?.[0];
    const paidAmount = payment ? parseFloat(payment.amount) : 0;

    if (!isPaid || paidAmount <= 0) return { success: true, paid: false };

    await finalizeQPayPayment(invoiceId, payment, paidAmount);
    return { success: true, paid: true };
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : "unknown";
    log.error("payment_check_qpay_error", { message: rawMsg });
    logPaymentEvent({
      invoiceId,
      provider: "qpay",
      event: "poll_check_error",
      message: rawMsg,
    });
    return { success: false, error: "Төлбөр шалгахад алдаа гарлаа" };
  }
}
