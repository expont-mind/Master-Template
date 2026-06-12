import { log } from "@/lib/utils/logger";

import { awardPointsForOrder, recordCouponUsage, recordPointUsage } from "./_internal";

import type { OrderResult } from "./_orderAfterPaymentHelpers";
import type { CreateOrderPayload } from "./_shared";
import type { SupabaseClient, User } from "@supabase/supabase-js";

type AdminClient = SupabaseClient;
type Outcome = { success: true; data: OrderResult } | { success: false; error: string };

interface RpcSuccessResult {
  order_id: string;
  orderNumber: string;
}

async function fetchOrderNumber(admin: AdminClient, orderId: string): Promise<string> {
  const { data: order } = await admin
    .from("orders")
    .select("order_number")
    .eq("id", orderId)
    .single();
  return order?.order_number ?? "";
}

async function recordRpcSideEffects(
  admin: AdminClient,
  user: User,
  payload: CreateOrderPayload,
  rpcResult: RpcSuccessResult,
): Promise<void> {
  if (payload.couponId && payload.couponDiscount) {
    await recordCouponUsage(
      admin,
      user.id,
      rpcResult.order_id,
      payload.couponId,
      payload.couponDiscount,
    );
  }
  if (payload.pointsUsed && payload.pointsUsed > 0) {
    await recordPointUsage(
      admin,
      user.id,
      rpcResult.order_id,
      rpcResult.orderNumber,
      payload.pointsUsed,
    );
  }
  const orderTotal = payload.total + (payload.pointDiscount ?? 0);
  await awardPointsForOrder(admin, user.id, rpcResult.order_id, rpcResult.orderNumber, orderTotal);
}

export async function tryRpcFallback(
  admin: AdminClient,
  user: User,
  payload: CreateOrderPayload,
): Promise<Outcome | null> {
  let rpcResponse;
  try {
    rpcResponse = await admin.rpc("create_order_from_invoice", {
      p_invoice_id: payload.invoiceId,
    });
  } catch (err) {
    log.error("order_rpc_fallback_exception", err);
    return null;
  }

  if (rpcResponse.error) return null;

  const result = rpcResponse.data as {
    success: boolean;
    order_id?: string;
    already_existed?: boolean;
    error?: string;
  };

  if (result.success && result.order_id) {
    const orderNumber = await fetchOrderNumber(admin, result.order_id);
    await recordRpcSideEffects(admin, user, payload, {
      order_id: result.order_id,
      orderNumber,
    });
    return {
      success: true,
      data: { orderId: result.order_id, orderNumber },
    };
  }

  if (result.error !== "No pending order data") {
    return {
      success: false,
      error: result.error || "Захиалга боловсруулахад алдаа гарлаа",
    };
  }
  return null;
}
