import { createAdminClient } from "@/lib/supabase/admin";

import {
  computeFinalTotal,
  decrementOrderStock,
  insertFreeOrder,
  insertOrderItems,
} from "./_freeOrderHelpers";
import {
  awardPointsForOrder,
  calculateDeliveryFee,
  ensurePublicUser,
  recordCouponUsage,
  recordPointUsage,
  validateOrderItems,
} from "./_internal";
import { generateOrderNumber, validateAddress, type CreateCheckoutInvoicePayload } from "./_shared";

import type { User } from "@supabase/supabase-js";

type Outcome =
  | { success: true; data: { orderId: string; orderNumber: string } }
  | { success: false; error: string };

export function validateFreeOrderPayload(
  user: User | null,
  payload: CreateCheckoutInvoicePayload,
): string | null {
  if (!user) return "Нэвтэрч орно уу";
  if (!payload.items || payload.items.length === 0) return "Сагс хоосон байна";
  const addrCheck = validateAddress(payload.address);
  if (!addrCheck.valid) return addrCheck.error;
  return null;
}

async function recordFreeOrderSideEffects(
  admin: ReturnType<typeof createAdminClient>,
  user: User,
  orderId: string,
  orderNumber: string,
  payload: CreateCheckoutInvoicePayload,
  couponDiscount: number,
): Promise<void> {
  if (payload.couponId && couponDiscount > 0) {
    await recordCouponUsage(admin, user.id, orderId, payload.couponId, couponDiscount);
  }
  if ((payload.pointsUsed ?? 0) > 0) {
    await recordPointUsage(admin, user.id, orderId, orderNumber, payload.pointsUsed!);
  }
  await awardPointsForOrder(admin, user.id, orderId, orderNumber, 0);
}

export async function executeFreeOrderFlow(
  user: User,
  payload: CreateCheckoutInvoicePayload,
): Promise<Outcome> {
  const orderNumber = generateOrderNumber();
  const admin = createAdminClient();
  await ensurePublicUser(admin, user);

  const itemsCheck = await validateOrderItems(admin, payload.items);
  if (!itemsCheck.valid) return { success: false, error: itemsCheck.error };

  const itemsTotal = payload.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = await calculateDeliveryFee(admin, payload.address.city, itemsTotal);
  const couponDiscount = payload.couponDiscount ?? 0;
  const { finalTotal } = computeFinalTotal(
    payload.items,
    deliveryFee,
    couponDiscount,
    payload.pointDiscount ?? 0,
  );
  if (finalTotal > 0) return { success: false, error: "Төлбөрийн дүн 0-ээс их байна" };

  const order = await insertFreeOrder(admin, {
    user_id: user.id,
    orderNumber,
    deliveryFee,
    address: payload.address,
    pointsUsed: payload.pointsUsed ?? 0,
    couponId: payload.couponId,
    couponDiscount,
  });
  if (!order) return { success: false, error: "Захиалга үүсгэхэд алдаа гарлаа" };

  const itemsOk = await insertOrderItems(admin, order.id, payload.items);
  if (!itemsOk) {
    return { success: false, error: "Захиалгын бүтээгдэхүүн хадгалахад алдаа гарлаа" };
  }

  await decrementOrderStock(admin, order.id);
  await recordFreeOrderSideEffects(admin, user, order.id, orderNumber, payload, couponDiscount);

  return { success: true, data: { orderId: order.id, orderNumber } };
}
