import { checkPayment } from "@/lib/qpay/client";

import {
  awardPointsForOrder,
  ensurePublicUser,
  recordCouponUsage,
  recordPointUsage,
} from "./_internal";
import {
  generateOrderNumber,
  type CreateOrderPayload,
  type DeliveryAddressPayload,
} from "./_shared";

import type { OrderResult } from "./_orderAfterPaymentHelpers";
import type { SupabaseClient, User } from "@supabase/supabase-js";

type AdminClient = SupabaseClient;
type Outcome = { success: true; data: OrderResult } | { success: false; error: string };

async function verifyPaymentStatus(
  admin: AdminClient,
  invoiceId: string,
  invoiceStatus: string,
): Promise<boolean> {
  if (invoiceStatus === "paid") return true;
  try {
    const paymentResult = await checkPayment(invoiceId);
    return paymentResult.invoice_status === "PAID" && paymentResult.payments?.length > 0;
  } catch {
    return false;
  }
}

async function fetchInvoiceAddress(
  admin: AdminClient,
  invoiceId: string,
): Promise<DeliveryAddressPayload | null> {
  const { data: invoiceFull } = await admin
    .from("payment_invoices")
    .select("pending_order_data")
    .eq("id", invoiceId)
    .single();
  const pendingData = invoiceFull?.pending_order_data as {
    address?: DeliveryAddressPayload;
  } | null;
  return pendingData?.address ?? null;
}

async function insertScratchOrder(
  admin: AdminClient,
  user: User,
  payload: CreateOrderPayload,
  orderNumber: string,
  address: DeliveryAddressPayload | null,
) {
  return admin
    .from("orders")
    .insert({
      user_id: user.id,
      order_number: orderNumber,
      status: "confirmed",
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      total_amount: payload.total,
      delivery_city: address?.city ?? null,
      delivery_district: address?.district ?? null,
      delivery_sub_district: address?.sub_district ?? null,
      delivery_detail: address?.detail ?? null,
    })
    .select("id, order_number")
    .single();
}

async function insertScratchOrderItems(
  admin: AdminClient,
  orderId: string,
  items: CreateOrderPayload["items"],
): Promise<boolean> {
  const orderItems = items.map((item) => ({
    order_id: orderId,
    product_id: item.productId,
    variant_id: item.variantId ?? null,
    variant_name: item.variantName ?? null,
    price: item.price,
    quantity: item.quantity,
  }));
  const { error } = await admin.from("order_items").insert(orderItems);
  return !error;
}

async function recordScratchSideEffects(
  admin: AdminClient,
  user: User,
  payload: CreateOrderPayload,
  newOrder: { id: string; order_number: string },
): Promise<void> {
  if (payload.couponId && payload.couponDiscount) {
    await recordCouponUsage(admin, user.id, newOrder.id, payload.couponId, payload.couponDiscount);
  }
  if (payload.pointsUsed && payload.pointsUsed > 0) {
    await recordPointUsage(admin, user.id, newOrder.id, newOrder.order_number, payload.pointsUsed);
  }
  const fallbackTotal = payload.total + (payload.pointDiscount ?? 0);
  await awardPointsForOrder(admin, user.id, newOrder.id, newOrder.order_number, fallbackTotal);
}

export async function createOrderFromScratch(
  admin: AdminClient,
  user: User,
  payload: CreateOrderPayload,
  invoice: { status: string; order_number: string | null },
): Promise<Outcome> {
  const verified = await verifyPaymentStatus(admin, payload.invoiceId, invoice.status);
  if (!verified) return { success: false, error: "Төлбөр баталгаажаагүй байна" };

  const orderNumber = invoice.order_number || generateOrderNumber();
  await ensurePublicUser(admin, user);
  const address = await fetchInvoiceAddress(admin, payload.invoiceId);

  const { data: newOrder, error: orderError } = await insertScratchOrder(
    admin,
    user,
    payload,
    orderNumber,
    address,
  );
  if (orderError || !newOrder) {
    return { success: false, error: "Захиалга үүсгэхэд алдаа гарлаа" };
  }

  const itemsOk = await insertScratchOrderItems(admin, newOrder.id, payload.items);
  if (!itemsOk) {
    return { success: false, error: "Захиалгын бүтээгдэхүүн хадгалахад алдаа гарлаа" };
  }

  await admin
    .from("payment_invoices")
    .update({ order_id: newOrder.id, status: "paid" })
    .eq("id", payload.invoiceId);

  await recordScratchSideEffects(admin, user, payload, newOrder);

  return {
    success: true,
    data: { orderId: newOrder.id, orderNumber: newOrder.order_number },
  };
}
