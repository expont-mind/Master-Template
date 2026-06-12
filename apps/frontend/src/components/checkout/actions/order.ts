"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/utils/logger";

import { executeFreeOrderFlow, validateFreeOrderPayload } from "./_freeOrderFlow";
import { fetchExistingOrder, processExistingOrder } from "./_orderAfterPaymentHelpers";
import { tryRpcFallback } from "./_orderRpcFallback";
import { createOrderFromScratch } from "./_orderScratch";

import type { CreateCheckoutInvoicePayload, CreateOrderPayload } from "./_shared";

type ServerResult<T> = { success: true; data: T } | { success: false; error: string };
type OrderResult = { orderId: string; orderNumber: string };

/**
 * Free-order path (totalPayable === 0): skips invoice/provider entirely
 * and creates a confirmed+paid order directly. Used when 100% coupon +
 * point discount covers the full subtotal+delivery.
 */
export async function createFreeOrder(
  payload: CreateCheckoutInvoicePayload,
): Promise<ServerResult<OrderResult>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const validationError = validateFreeOrderPayload(user, payload);
  if (validationError) return { success: false, error: validationError };

  try {
    return await executeFreeOrderFlow(user!, payload);
  } catch (err) {
    log.error("free_order_unexpected_error", err);
    return { success: false, error: "Захиалга үүсгэхэд алдаа гарлаа" };
  }
}

/**
 * Order finalization after payment confirmed.
 *
 * Hard invariant: this function is IDEMPOTENT. The caller (PaymentModal,
 * payment callback handlers, recoverPendingInvoices) may invoke it
 * multiple times for the same invoice — it must always return success
 * without double-charging coupon/point usage or duplicating orders.
 */
export async function createOrderAfterPayment(
  payload: CreateOrderPayload,
): Promise<ServerResult<OrderResult>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Нэвтэрч орно уу" };

  const admin = createAdminClient();

  const { data: invoice, error: invoiceError } = await admin
    .from("payment_invoices")
    .select("status, order_number, order_id")
    .eq("id", payload.invoiceId)
    .single();
  if (invoiceError || !invoice) {
    return { success: false, error: "Нэхэмжлэл олдсонгүй" };
  }

  // Branch 1: linked order exists → confirm via RPC (idempotent)
  if (invoice.order_id) {
    const existingOrder = await fetchExistingOrder(admin, invoice.order_id);
    if (existingOrder) {
      return processExistingOrder(admin, user, payload, existingOrder);
    }
  }

  // Branch 2: RPC fallback for invoices without linked order
  const rpcOutcome = await tryRpcFallback(admin, user, payload);
  if (rpcOutcome) return rpcOutcome;

  // Branch 3: last-resort scratch creation for pre-migration invoices
  return createOrderFromScratch(admin, user, payload, invoice);
}
