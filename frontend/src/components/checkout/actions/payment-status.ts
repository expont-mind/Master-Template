"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkPayment } from "@/lib/qpay/client";
import { resolvePaymentWallet } from "@/lib/qpay/utils";
import { getLendMNInvoiceStatus } from "@/lib/lendmn/client";
import { getStorePayInvoiceStatus } from "@/lib/storepay/client";
import { logPaymentEvent } from "@/lib/payment-logger";
import { log } from "@/lib/utils/logger";

export async function checkPaymentStatus(
  invoiceId: string,
  provider: "qpay" | "lendmn" | "storepay" = "qpay",
): Promise<
  { success: true; paid: boolean } | { success: false; error: string }
> {
  const supabase = await createClient();

  // 1) Check our DB first (updated by callback)
  try {
    const { data: invoice } = await supabase
      .from("payment_invoices")
      .select("status")
      .eq("id", invoiceId)
      .single();

    if (invoice?.status === "paid") {
      return { success: true, paid: true };
    }
  } catch {
    // DB exception - continue to provider check
  }

  // 2) For LendMN: check via direct API call
  if (provider === "lendmn") {
    try {
      const admin = createAdminClient();
      const { data: inv } = await admin
        .from("payment_invoices")
        .select("external_invoice_number")
        .eq("id", invoiceId)
        .eq("provider", "lendmn")
        .single();

      if (inv?.external_invoice_number) {
        const result = await getLendMNInvoiceStatus(inv.external_invoice_number);

        if (result.paid) {
          await admin
            .from("payment_invoices")
            .update({
              status: "paid",
              paid_amount: result.amount ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", invoiceId);

          await admin.rpc("create_order_from_invoice", { p_invoice_id: invoiceId });

          return { success: true, paid: true };
        }
      }

      return { success: true, paid: false };
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : "unknown";
      log.error("payment_check_lendmn_error", { message: rawMsg });
      logPaymentEvent({ invoiceId, provider: "lendmn", event: "poll_check_error", message: rawMsg });
      return { success: false, error: "LendMN төлбөр шалгахад алдаа гарлаа" };
    }
  }

  // 3) For StorePay: check via direct API call
  if (provider === "storepay") {
    try {
      const admin = createAdminClient();
      const { data: inv } = await admin
        .from("payment_invoices")
        .select("external_invoice_number")
        .eq("id", invoiceId)
        .eq("provider", "storepay")
        .single();

      if (inv?.external_invoice_number) {
        const result = await getStorePayInvoiceStatus(inv.external_invoice_number);

        if (result.paid) {
          try {
            await admin
              .from("payment_invoices")
              .update({
                status: "paid",
                paid_amount: result.amount ?? null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", invoiceId);

            const { error: rpcErr } = await admin.rpc("create_order_from_invoice", {
              p_invoice_id: invoiceId,
            });
            if (rpcErr) {
              log.error("payment_check_storepay_rpc_error", { error: rpcErr, invoiceId });
              logPaymentEvent({ invoiceId, provider: "storepay", event: "poll_rpc_error", message: rpcErr.message });
            }
          } catch (e) {
            log.error("payment_check_storepay_db_rpc_error", { error: e, invoiceId });
            logPaymentEvent({ invoiceId, provider: "storepay", event: "poll_db_rpc_error", message: e instanceof Error ? e.message : String(e) });
          }
          return { success: true, paid: true };
        }
      }

      return { success: true, paid: false };
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : "unknown";
      log.error("payment_check_storepay_error", { message: rawMsg });
      logPaymentEvent({ invoiceId, provider: "storepay", event: "poll_check_error", message: rawMsg });
      return { success: false, error: "StorePay төлбөр шалгахад алдаа гарлаа" };
    }
  }

  // 4) Fallback for QPay: check QPay API directly
  try {
    const result = await checkPayment(invoiceId);

    const isPaid = result.invoice_status === "PAID";
    const payment = result.payments?.[0];
    const paidAmount = payment ? parseFloat(payment.amount) : 0;

    if (isPaid && paidAmount > 0) {
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
        } catch { /* non-blocking; other paths will retry */ }
      } catch {
        // DB update failed — not critical, payment is confirmed
      }

      return { success: true, paid: true };
    }

    return { success: true, paid: false };
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : "unknown";
    log.error("payment_check_qpay_error", { message: rawMsg });
    logPaymentEvent({ invoiceId, provider: "qpay", event: "poll_check_error", message: rawMsg });
    return {
      success: false,
      error: "Төлбөр шалгахад алдаа гарлаа",
    };
  }
}

export async function recoverPendingInvoices(): Promise<{
  recovered: number;
  checked: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { recovered: 0, checked: 0 };
  }

  const admin = createAdminClient();

  // Recovery window widened to 24h (was 2h). Late callbacks from QPay/LendMN
  // arriving after the previous 2h cap were never reconciled. Cap row count
  // at 20 (was 5) so we don't drop legitimately backed-up invoices on a busy
  // user. The RPC is idempotent and the per-row work is light.
  const recoveryWindowStart = new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  ).toISOString();
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

  const { data: paidInvoices, error: fetchError } = await admin
    .from("payment_invoices")
    .select("id, provider, order_id")
    .eq("user_id", user.id)
    .eq("status", "paid")
    .gte("created_at", recoveryWindowStart)
    .lte("created_at", oneMinuteAgo)
    .not("order_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: pendingInvoices } = await admin
    .from("payment_invoices")
    .select("id, provider")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .gte("created_at", recoveryWindowStart)
    .lte("created_at", oneMinuteAgo)
    .is("order_id", null)
    .order("created_at", { ascending: false })
    .limit(20);

  const allInvoices = [...(paidInvoices ?? []), ...(pendingInvoices ?? [])];

  if (fetchError || !allInvoices.length) {
    return { recovered: 0, checked: 0 };
  }

  let recovered = 0;

  for (const inv of allInvoices) {
    try {
      const orderId = "order_id" in inv ? (inv as { order_id: string | null }).order_id : null;
      if (orderId) {
        const { data: order } = await admin
          .from("orders")
          .select("status, payment_status")
          .eq("id", orderId)
          .single();

        if (order?.status === "confirmed" && order?.payment_status === "paid") continue;

        const { data: rpcResult, error: rpcError } = await admin.rpc(
          "create_order_from_invoice",
          { p_invoice_id: inv.id },
        );

        if (!rpcError) {
          const result = rpcResult as { success: boolean; order_id?: string };
          if (result.success) recovered++;
        }
        continue;
      }

      // For pending invoices without order_id (legacy path)
      const provider = (inv.provider as "qpay" | "lendmn" | "storepay") ?? "qpay";
      const statusResult = await checkPaymentStatus(inv.id, provider);

      if (!statusResult.success || !statusResult.paid) continue;

      const { data: rpcResult, error: rpcError } = await admin.rpc(
        "create_order_from_invoice",
        { p_invoice_id: inv.id },
      );

      if (rpcError) continue;

      const result = rpcResult as { success: boolean; order_id?: string };
      if (result.success && result.order_id) recovered++;
    } catch {
      // Error processing invoice - continue
    }
  }

  return { recovered, checked: allInvoices.length };
}
