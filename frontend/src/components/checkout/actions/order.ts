"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkPayment } from "@/lib/qpay/client";
import { logPaymentEvent } from "@/lib/payment-logger";
import { log } from "@/lib/utils/logger";
import {
  generateOrderNumber,
  validateAddress,
  type CreateCheckoutInvoicePayload,
  type CreateOrderPayload,
  type DeliveryAddressPayload,
} from "./_shared";
import {
  awardPointsForOrder,
  calculateDeliveryFee,
  ensurePublicUser,
  recordCouponUsage,
  recordPointUsage,
  validateOrderItems,
} from "./_internal";

/**
 * Free-order path (totalPayable === 0): skips invoice/provider entirely
 * and creates a confirmed+paid order directly. Used when 100% coupon +
 * point discount covers the full subtotal+delivery.
 */
export async function createFreeOrder(
  payload: CreateCheckoutInvoicePayload,
): Promise<
  | { success: true; data: { orderId: string; orderNumber: string } }
  | { success: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Нэвтэрч орно уу" };
  }

  if (!payload.items || payload.items.length === 0) {
    return { success: false, error: "Сагс хоосон байна" };
  }

  const addrCheck = validateAddress(payload.address);
  if (!addrCheck.valid) {
    return { success: false, error: addrCheck.error };
  }

  try {
    const orderNumber = generateOrderNumber();
    const admin = createAdminClient();

    await ensurePublicUser(admin, user);

    const itemsCheck = await validateOrderItems(admin, payload.items);
    if (!itemsCheck.valid) {
      return { success: false, error: itemsCheck.error };
    }

    // Server-side total verification (security check)
    const itemsTotal = payload.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryFee = await calculateDeliveryFee(admin, payload.address.city, itemsTotal);
    const couponDiscount = payload.couponDiscount ?? 0;
    const pointDiscount = payload.pointDiscount ?? 0;
    const finalTotal = itemsTotal + deliveryFee - couponDiscount - pointDiscount;

    if (finalTotal > 0) {
      return { success: false, error: "Төлбөрийн дүн 0-ээс их байна" };
    }

    // 1. Create order directly as confirmed/paid
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        status: "confirmed",
        payment_status: "paid",
        paid_at: new Date().toISOString(),
        payment_method: "free",
        total_amount: 0,
        delivery_fee: deliveryFee,
        delivery_city: payload.address.city,
        delivery_district: payload.address.district,
        delivery_sub_district: payload.address.sub_district,
        delivery_detail: payload.address.detail,
        points_used: payload.pointsUsed ?? 0,
        coupon_id: payload.couponId ?? null,
        coupon_discount: couponDiscount,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      log.error("free_order_creation_failed", orderError);
      return { success: false, error: "Захиалга үүсгэхэд алдаа гарлаа" };
    }

    // 2. Create order items
    const orderItems = payload.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId ?? null,
      variant_name: item.variantName ?? null,
      price: item.price,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await admin
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      log.error("free_order_items_insert_failed", itemsError);
      await admin.from("orders").delete().eq("id", order.id);
      return { success: false, error: "Захиалгын бүтээгдэхүүн хадгалахад алдаа гарлаа" };
    }

    // 3. Decrement stock
    try {
      await admin.rpc("decrement_order_stock", { p_order_id: order.id });
      await admin
        .from("orders")
        .update({ stock_decremented: true })
        .eq("id", order.id);
    } catch (err) {
      log.error("free_order_stock_decrement_failed", err);
    }

    if (payload.couponId && couponDiscount > 0) {
      await recordCouponUsage(admin, user.id, order.id, payload.couponId, couponDiscount);
    }

    if ((payload.pointsUsed ?? 0) > 0) {
      await recordPointUsage(admin, user.id, order.id, orderNumber, payload.pointsUsed!);
    }

    // 6. Award points (2% of 0 = 0, but call for consistency)
    await awardPointsForOrder(admin, user.id, order.id, orderNumber, 0);

    return {
      success: true,
      data: { orderId: order.id, orderNumber },
    };
  } catch (err) {
    log.error("free_order_unexpected_error", err);
    return {
      success: false,
      error: "Захиалга үүсгэхэд алдаа гарлаа",
    };
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
): Promise<
  | { success: true; data: { orderId: string; orderNumber: string } }
  | { success: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Нэвтэрч орно уу" };
  }

  const admin = createAdminClient();

  // 1. Find the invoice and linked order
  const { data: invoice, error: invoiceError } = await admin
    .from("payment_invoices")
    .select("status, order_number, order_id")
    .eq("id", payload.invoiceId)
    .single();

  if (invoiceError || !invoice) {
    return { success: false, error: "Нэхэмжлэл олдсонгүй" };
  }

  // 2. Check if order already exists and is linked
  if (invoice.order_id) {
    const { data: existingOrder } = await admin
      .from("orders")
      .select("id, order_number, status, payment_status, points_used, coupon_id, coupon_discount")
      .eq("id", invoice.order_id)
      .single();

    if (existingOrder) {
      // If not yet confirmed, use RPC to confirm order (handles stock decrement + invoice update)
      if (!(existingOrder.status === "confirmed" && existingOrder.payment_status === "paid")) {
        const { data: rpcData, error: rpcErr } = await admin.rpc(
          "create_order_from_invoice",
          { p_invoice_id: payload.invoiceId },
        );

        if (rpcErr) {
          log.error("order_after_payment_rpc_error", rpcErr);
          await logPaymentEvent({ invoiceId: payload.invoiceId, orderId: existingOrder.id, event: "order_confirm_rpc_error", message: rpcErr.message });
          return { success: false, error: "Захиалга баталгаажуулахад алдаа гарлаа" };
        }

        const rpcResult = rpcData as { success: boolean; error?: string } | null;
        if (rpcResult && !rpcResult.success) {
          log.error("order_after_payment_rpc_failure", { error: rpcResult.error });
          await logPaymentEvent({ invoiceId: payload.invoiceId, orderId: existingOrder.id, event: "order_confirm_rpc_failure", message: rpcResult.error });
          return { success: false, error: "Захиалга баталгаажуулахад алдаа гарлаа" };
        }
      }

      // Use order-stored values (reliable) with payload as fallback
      const effectiveCouponId = existingOrder.coupon_id || payload.couponId;
      const effectiveCouponDiscount = existingOrder.coupon_discount || payload.couponDiscount || 0;
      const effectivePointsUsed = existingOrder.points_used || payload.pointsUsed || 0;

      // Record coupon usage if applicable (idempotent)
      if (effectiveCouponId && effectiveCouponDiscount) {
        await recordCouponUsage(admin, user.id, existingOrder.id, effectiveCouponId, effectiveCouponDiscount);
      }

      // Record point usage and award points (idempotent)
      if (effectivePointsUsed > 0) {
        await recordPointUsage(admin, user.id, existingOrder.id, existingOrder.order_number, effectivePointsUsed);
      }
      const orderTotal = payload.total + effectivePointsUsed;
      await awardPointsForOrder(admin, user.id, existingOrder.id, existingOrder.order_number, orderTotal);

      return {
        success: true,
        data: {
          orderId: existingOrder.id,
          orderNumber: existingOrder.order_number,
        },
      };
    }
  }

  // 3. Fallback for old invoices without order_id - use RPC
  try {
    const { data: rpcResult, error: rpcError } = await admin.rpc(
      "create_order_from_invoice",
      { p_invoice_id: payload.invoiceId },
    );

    if (!rpcError) {
      const result = rpcResult as {
        success: boolean;
        order_id?: string;
        already_existed?: boolean;
        error?: string;
      };

      if (result.success && result.order_id) {
        const { data: order } = await admin
          .from("orders")
          .select("order_number")
          .eq("id", result.order_id)
          .single();

        const rpcOrderNumber = order?.order_number ?? "";

        if (payload.couponId && payload.couponDiscount) {
          await recordCouponUsage(admin, user.id, result.order_id, payload.couponId, payload.couponDiscount);
        }

        if (payload.pointsUsed && payload.pointsUsed > 0) {
          await recordPointUsage(admin, user.id, result.order_id, rpcOrderNumber, payload.pointsUsed);
        }
        const rpcOrderTotal = payload.total + (payload.pointDiscount ?? 0);
        await awardPointsForOrder(admin, user.id, result.order_id, rpcOrderNumber, rpcOrderTotal);

        return {
          success: true,
          data: {
            orderId: result.order_id,
            orderNumber: rpcOrderNumber,
          },
        };
      }

      if (result.error !== "No pending order data") {
        return {
          success: false,
          error: result.error || "Захиалга боловсруулахад алдаа гарлаа",
        };
      }
    }
  } catch {
    // RPC exception - continue to fallback
  }

  // 4. Last resort fallback for pre-migration invoices: create order from scratch
  let paymentVerified = invoice.status === "paid";

  if (!paymentVerified) {
    try {
      const paymentResult = await checkPayment(payload.invoiceId);
      if (
        paymentResult.invoice_status === "PAID" &&
        paymentResult.payments?.length > 0
      ) {
        paymentVerified = true;
      }
    } catch {
      // QPay check failed
    }
  }

  if (!paymentVerified) {
    return { success: false, error: "Төлбөр баталгаажаагүй байна" };
  }

  const orderNumber = invoice.order_number || generateOrderNumber();

  await ensurePublicUser(admin, user);

  // Read address from pending_order_data if available
  const { data: invoiceFull } = await admin
    .from("payment_invoices")
    .select("pending_order_data")
    .eq("id", payload.invoiceId)
    .single();
  const pendingData = invoiceFull?.pending_order_data as { address?: DeliveryAddressPayload } | null;

  const { data: newOrder, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      order_number: orderNumber,
      status: "confirmed",
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      total_amount: payload.total,
      delivery_city: pendingData?.address?.city ?? null,
      delivery_district: pendingData?.address?.district ?? null,
      delivery_sub_district: pendingData?.address?.sub_district ?? null,
      delivery_detail: pendingData?.address?.detail ?? null,
    })
    .select("id, order_number")
    .single();

  if (orderError || !newOrder) {
    return {
      success: false,
      error: "Захиалга үүсгэхэд алдаа гарлаа",
    };
  }

  const orderItems = payload.items.map((item) => ({
    order_id: newOrder.id,
    product_id: item.productId,
    variant_id: item.variantId ?? null,
    variant_name: item.variantName ?? null,
    price: item.price,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await admin
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    return {
      success: false,
      error: "Захиалгын бүтээгдэхүүн хадгалахад алдаа гарлаа",
    };
  }

  // Link invoice to new order
  await admin
    .from("payment_invoices")
    .update({ order_id: newOrder.id, status: "paid" })
    .eq("id", payload.invoiceId);

  if (payload.couponId && payload.couponDiscount) {
    await recordCouponUsage(admin, user.id, newOrder.id, payload.couponId, payload.couponDiscount);
  }

  if (payload.pointsUsed && payload.pointsUsed > 0) {
    await recordPointUsage(admin, user.id, newOrder.id, newOrder.order_number, payload.pointsUsed);
  }
  const fallbackOrderTotal = payload.total + (payload.pointDiscount ?? 0);
  await awardPointsForOrder(admin, user.id, newOrder.id, newOrder.order_number, fallbackOrderTotal);

  return {
    success: true,
    data: { orderId: newOrder.id, orderNumber: newOrder.order_number },
  };
}
