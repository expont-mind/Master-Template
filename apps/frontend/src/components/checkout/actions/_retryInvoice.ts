import { createInvoice } from "@/lib/qpay/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { BRAND } from "@/lib/utils/brand-config";
import { log } from "@/lib/utils/logger";

import { validateOrderItems } from "./_internal";
import { type OrderItemPayload } from "./_shared";

import type { QPayInvoiceData } from "@/lib/qpay/types";

interface RetryOrder {
  id: string;
  order_number: string;
  total_amount: number;
  points_used: number | null;
  coupon_discount: number | null;
}

interface AssertResult {
  ok: true;
  order: RetryOrder;
  admin: ReturnType<typeof createAdminClient>;
}

type AssertOutcome = AssertResult | { ok: false; error: string };

async function fetchOrderForRetry(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
  userId: string,
): Promise<
  { ok: true; order: RetryOrder & { payment_status: string } } | { ok: false; error: string }
> {
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(
      "id, order_number, total_amount, user_id, payment_status, points_used, coupon_discount, coupon_id",
    )
    .eq("id", orderId)
    .single();

  if (orderError || !order) return { ok: false, error: "Захиалга олдсонгүй" };
  if (order.user_id !== userId) return { ok: false, error: "Зөвшөөрөлгүй" };
  if (order.payment_status === "paid") {
    return { ok: false, error: "Захиалга аль хэдийн төлөгдсөн" };
  }
  return { ok: true, order };
}

async function revalidateOrderItems(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: orderItems, error: itemsReadError } = await admin
    .from("order_items")
    .select("product_id, variant_id, quantity, variant_name, products(name)")
    .eq("order_id", orderId);

  if (itemsReadError || !orderItems || orderItems.length === 0) {
    return { ok: false, error: "Захиалгын бараанууд олдсонгүй" };
  }

  const itemsForValidation: OrderItemPayload[] = orderItems.map((row) => {
    const productRel = Array.isArray(row.products) ? row.products[0] : row.products;
    return {
      productId: row.product_id,
      name: productRel?.name ?? row.variant_name ?? "Бүтээгдэхүүн",
      price: 0,
      quantity: row.quantity,
      variantId: row.variant_id,
      variantName: row.variant_name ?? null,
    };
  });

  const validation = await validateOrderItems(admin, itemsForValidation);
  if (!validation.valid) return { ok: false, error: validation.error };
  return { ok: true };
}

export async function assertOrderPayable(orderId: string, userId: string): Promise<AssertOutcome> {
  const admin = createAdminClient();
  const orderResult = await fetchOrderForRetry(admin, orderId, userId);
  if (!orderResult.ok) return orderResult;

  const validation = await revalidateOrderItems(admin, orderId);
  if (!validation.ok) return validation;

  return { ok: true, order: orderResult.order, admin };
}

interface RetryInvoiceResult {
  success: boolean;
  data?: {
    invoice: QPayInvoiceData;
    orderNumber: string;
    orderId: string;
    totalAmount: number;
  };
  error?: string;
}

async function buildCustomerName(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<string> {
  const { data: userData } = await admin
    .from("users")
    .select("first_name, last_name")
    .eq("id", userId)
    .single();
  if (!userData) return "Customer";
  return `${userData.last_name ?? ""} ${userData.first_name ?? ""}`.trim() || "Customer";
}

interface ExecuteRetryArgs {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
  order: RetryOrder;
  fullPrice: number;
}

async function executeRetryInvoice({
  admin,
  userId,
  order,
  fullPrice,
}: ExecuteRetryArgs): Promise<RetryInvoiceResult> {
  await admin
    .from("payment_invoices")
    .update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("order_id", order.id)
    .eq("status", "pending");

  const customerName = await buildCustomerName(admin, userId);

  try {
    const invoice = await createInvoice({
      amount: fullPrice,
      description: `${BRAND.name} захиалга: ${order.order_number}`,
      customerName,
      callbackUrl:
        process.env.QPAY_CALLBACK_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/checkout/callback`,
    });

    await admin.from("payment_invoices").insert({
      id: invoice.id,
      user_id: userId,
      amount: fullPrice,
      status: "pending",
      order_number: order.order_number,
      order_id: order.id,
    });

    await admin
      .from("orders")
      .update({
        payment_status: "pending",
        total_amount: fullPrice,
        points_used: 0,
        coupon_discount: 0,
        coupon_id: null,
      })
      .eq("id", order.id);

    return {
      success: true,
      data: {
        invoice,
        orderNumber: order.order_number,
        orderId: order.id,
        totalAmount: fullPrice,
      },
    };
  } catch (err) {
    log.error("retry_invoice_unexpected_error", err);
    return { success: false, error: "Нэхэмжлэл үүсгэхэд алдаа гарлаа" };
  }
}

export async function createInvoiceForExistingOrderFlow(
  orderId: string,
  userId: string,
): Promise<RetryInvoiceResult> {
  const guard = await assertOrderPayable(orderId, userId);
  if (!guard.ok) return { success: false, error: guard.error };

  const { admin, order } = guard;
  const pointDiscount = order.points_used ?? 0;
  const couponDiscount = order.coupon_discount ?? 0;
  const fullPrice = order.total_amount + pointDiscount + couponDiscount;

  return executeRetryInvoice({ admin, userId, order, fullPrice });
}
