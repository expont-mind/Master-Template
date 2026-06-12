import { log } from "@/lib/utils/logger";

import type { CreateCheckoutInvoicePayload } from "./_shared";
import type { SupabaseClient } from "@supabase/supabase-js";

type AdminClient = SupabaseClient;

interface FreeOrderInsertInput {
  user_id: string;
  orderNumber: string;
  deliveryFee: number;
  address: CreateCheckoutInvoicePayload["address"];
  pointsUsed: number;
  couponId: string | null | undefined;
  couponDiscount: number;
}

export async function insertFreeOrder(
  admin: AdminClient,
  input: FreeOrderInsertInput,
): Promise<{ id: string } | null> {
  const { data: order, error } = await admin
    .from("orders")
    .insert({
      user_id: input.user_id,
      order_number: input.orderNumber,
      status: "confirmed",
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      payment_method: "free",
      total_amount: 0,
      delivery_fee: input.deliveryFee,
      delivery_city: input.address.city,
      delivery_district: input.address.district,
      delivery_sub_district: input.address.sub_district,
      delivery_detail: input.address.detail,
      points_used: input.pointsUsed,
      coupon_id: input.couponId ?? null,
      coupon_discount: input.couponDiscount,
    })
    .select("id")
    .single();

  if (error || !order) {
    log.error("free_order_creation_failed", error);
    return null;
  }
  return order;
}

export async function insertOrderItems(
  admin: AdminClient,
  orderId: string,
  items: CreateCheckoutInvoicePayload["items"],
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
  if (error) {
    log.error("free_order_items_insert_failed", error);
    await admin.from("orders").delete().eq("id", orderId);
    return false;
  }
  return true;
}

export async function decrementOrderStock(admin: AdminClient, orderId: string): Promise<void> {
  try {
    await admin.rpc("decrement_order_stock", { p_order_id: orderId });
    await admin.from("orders").update({ stock_decremented: true }).eq("id", orderId);
  } catch (err) {
    log.error("free_order_stock_decrement_failed", err);
  }
}

export function computeFinalTotal(
  items: CreateCheckoutInvoicePayload["items"],
  deliveryFee: number,
  couponDiscount: number,
  pointDiscount: number,
): { itemsTotal: number; finalTotal: number } {
  const itemsTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const finalTotal = itemsTotal + deliveryFee - couponDiscount - pointDiscount;
  return { itemsTotal, finalTotal };
}
