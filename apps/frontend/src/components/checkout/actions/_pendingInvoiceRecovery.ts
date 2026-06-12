// Helpers for recoverPendingInvoices. Split out so the action body
// stays under the complexity limit.

import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

export interface RecoveryWindow {
  start: string;
  cutoff: string;
}

export function buildRecoveryWindow(): RecoveryWindow {
  // Recovery window widened to 24h (was 2h). Late callbacks from QPay/LendMN
  // arriving after the previous 2h cap were never reconciled. Cap row count
  // at 20 (was 5) so we don't drop legitimately backed-up invoices on a busy
  // user. The RPC is idempotent and the per-row work is light.
  const start = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const cutoff = new Date(Date.now() - 60 * 1000).toISOString();
  return { start, cutoff };
}

export interface RecoverableInvoice {
  id: string;
  provider: string;
  order_id?: string | null;
}

export async function fetchPaidRecoverableInvoices(
  admin: Admin,
  userId: string,
  window: RecoveryWindow,
) {
  return admin
    .from("payment_invoices")
    .select("id, provider, order_id")
    .eq("user_id", userId)
    .eq("status", "paid")
    .gte("created_at", window.start)
    .lte("created_at", window.cutoff)
    .not("order_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);
}

export async function fetchPendingRecoverableInvoices(
  admin: Admin,
  userId: string,
  window: RecoveryWindow,
) {
  return admin
    .from("payment_invoices")
    .select("id, provider")
    .eq("user_id", userId)
    .eq("status", "pending")
    .gte("created_at", window.start)
    .lte("created_at", window.cutoff)
    .is("order_id", null)
    .order("created_at", { ascending: false })
    .limit(20);
}

/** Returns true when the order is fully confirmed+paid already. */
async function isOrderAlreadyConfirmed(admin: Admin, orderId: string): Promise<boolean> {
  const { data: order } = await admin
    .from("orders")
    .select("status, payment_status")
    .eq("id", orderId)
    .single();
  return order?.status === "confirmed" && order?.payment_status === "paid";
}

async function runRecoveryRpc(
  admin: Admin,
  invoiceId: string,
): Promise<{ recovered: boolean; orderId?: string }> {
  const { data: rpcResult, error: rpcError } = await admin.rpc("create_order_from_invoice", {
    p_invoice_id: invoiceId,
  });
  if (rpcError) return { recovered: false };
  const result = rpcResult as { success: boolean; order_id?: string };
  return {
    recovered: result.success,
    orderId: result.order_id,
  };
}

/**
 * Recover a single invoice.
 *  - If the invoice has an order_id and the order is already confirmed, skip.
 *  - If it has an order_id but not confirmed, just rerun the RPC.
 *  - If it has no order_id (legacy path), poll the provider first and only
 *    run the RPC when the provider confirms payment.
 *
 * The provider polling step is delegated back to the caller via
 * `checkPaymentStatus` to avoid a circular import.
 */
export async function recoverSingleInvoice(
  admin: Admin,
  inv: RecoverableInvoice,
  checkPaymentStatus: (
    invoiceId: string,
    provider: "qpay" | "lendmn" | "storepay",
  ) => Promise<{ success: true; paid: boolean } | { success: false; error: string }>,
): Promise<boolean> {
  try {
    const orderId = inv.order_id ?? null;
    if (orderId) {
      if (await isOrderAlreadyConfirmed(admin, orderId)) return false;
      const r = await runRecoveryRpc(admin, inv.id);
      return r.recovered;
    }

    // For pending invoices without order_id (legacy path)
    const provider = (inv.provider as "qpay" | "lendmn" | "storepay") ?? "qpay";
    const statusResult = await checkPaymentStatus(inv.id, provider);
    if (!statusResult.success || !statusResult.paid) return false;

    const r = await runRecoveryRpc(admin, inv.id);
    return r.recovered && !!r.orderId;
  } catch {
    return false;
  }
}
