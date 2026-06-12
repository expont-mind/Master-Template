import { logPaymentEvent } from "@/lib/payment-logger";
import { log } from "@/lib/utils/logger";

import { awardPointsForOrder, recordCouponUsage, recordPointUsage } from "./_internal";

import type { CreateOrderPayload } from "./_shared";
import type { SupabaseClient, User } from "@supabase/supabase-js";

type AdminClient = SupabaseClient;

export interface OrderResult {
  orderId: string;
  orderNumber: string;
}

type Outcome = { success: true; data: OrderResult } | { success: false; error: string };

interface ExistingOrderRow {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  points_used: number | null;
  coupon_id: string | null;
  coupon_discount: number | null;
}

function isOrderConfirmedAndPaid(order: ExistingOrderRow): boolean {
  return order.status === "confirmed" && order.payment_status === "paid";
}

async function confirmOrderViaRpc(
  admin: AdminClient,
  invoiceId: string,
  existingOrder: ExistingOrderRow,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isOrderConfirmedAndPaid(existingOrder)) return { ok: true };

  const { data: rpcData, error: rpcErr } = await admin.rpc("create_order_from_invoice", {
    p_invoice_id: invoiceId,
  });

  if (rpcErr) {
    log.error("order_after_payment_rpc_error", rpcErr);
    await logPaymentEvent({
      invoiceId,
      orderId: existingOrder.id,
      event: "order_confirm_rpc_error",
      message: rpcErr.message,
    });
    return { ok: false, error: "Захиалга баталгаажуулахад алдаа гарлаа" };
  }

  const rpcResult = rpcData as { success: boolean; error?: string } | null;
  if (rpcResult && !rpcResult.success) {
    log.error("order_after_payment_rpc_failure", { error: rpcResult.error });
    await logPaymentEvent({
      invoiceId,
      orderId: existingOrder.id,
      event: "order_confirm_rpc_failure",
      message: rpcResult.error,
    });
    return { ok: false, error: "Захиалга баталгаажуулахад алдаа гарлаа" };
  }
  return { ok: true };
}

async function recordExistingOrderSideEffects(
  admin: AdminClient,
  user: User,
  payload: CreateOrderPayload,
  existingOrder: ExistingOrderRow,
): Promise<void> {
  const effectiveCouponId = existingOrder.coupon_id || payload.couponId;
  const effectiveCouponDiscount = existingOrder.coupon_discount || payload.couponDiscount || 0;
  const effectivePointsUsed = existingOrder.points_used || payload.pointsUsed || 0;

  if (effectiveCouponId && effectiveCouponDiscount) {
    await recordCouponUsage(
      admin,
      user.id,
      existingOrder.id,
      effectiveCouponId,
      effectiveCouponDiscount,
    );
  }
  if (effectivePointsUsed > 0) {
    await recordPointUsage(
      admin,
      user.id,
      existingOrder.id,
      existingOrder.order_number,
      effectivePointsUsed,
    );
  }
  const orderTotal = payload.total + effectivePointsUsed;
  await awardPointsForOrder(
    admin,
    user.id,
    existingOrder.id,
    existingOrder.order_number,
    orderTotal,
  );
}

export async function processExistingOrder(
  admin: AdminClient,
  user: User,
  payload: CreateOrderPayload,
  existingOrder: ExistingOrderRow,
): Promise<Outcome> {
  const confirmResult = await confirmOrderViaRpc(admin, payload.invoiceId, existingOrder);
  if (!confirmResult.ok) {
    return { success: false, error: confirmResult.error };
  }
  await recordExistingOrderSideEffects(admin, user, payload, existingOrder);
  return {
    success: true,
    data: { orderId: existingOrder.id, orderNumber: existingOrder.order_number },
  };
}

export async function fetchExistingOrder(
  admin: AdminClient,
  orderId: string,
): Promise<ExistingOrderRow | null> {
  const { data } = await admin
    .from("orders")
    .select("id, order_number, status, payment_status, points_used, coupon_id, coupon_discount")
    .eq("id", orderId)
    .single();
  return data as ExistingOrderRow | null;
}
