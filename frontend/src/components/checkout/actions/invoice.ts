"use server";

import { BRAND } from "@/lib/utils/brand-config";
import { log } from "@/lib/utils/logger";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInvoice } from "@/lib/qpay/client";
import { createLendMNInvoice } from "@/lib/lendmn/client";
import { createStorePayInvoice } from "@/lib/storepay/client";
import type { QPayInvoiceData } from "@/lib/qpay/types";
import type { Json } from "@/types/database";
import { STOREPAY_MIN_AMOUNT } from "@/lib/utils/constants";
import {
  generateOrderNumber,
  validateAddress,
  type CreateCheckoutInvoicePayload,
  type CreateLendMNCheckoutInvoicePayload,
  type CreateStorePayCheckoutInvoicePayload,
  type OrderItemPayload,
} from "./_shared";
import {
  calculateDeliveryFee,
  ensurePublicUser,
  validateOrderItems,
} from "./_internal";

export async function createCheckoutInvoice(
  payload: CreateCheckoutInvoicePayload,
): Promise<
  | { success: true; data: { invoice: QPayInvoiceData; orderNumber: string; orderId: string } }
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

    const itemsTotal = payload.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryFee = await calculateDeliveryFee(admin, payload.address.city, itemsTotal);
    const couponDiscount = payload.couponDiscount ?? 0;
    const pointDiscount = payload.pointDiscount ?? 0;
    const finalTotal = itemsTotal + deliveryFee - couponDiscount - pointDiscount;

    // 1. Create order with pending status FIRST
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        status: "pending",
        payment_status: "unpaid",
        payment_method: "qpay",
        total_amount: finalTotal,
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
      log.error("checkout_invoice_order_creation_failed", orderError);
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
      log.error("checkout_invoice_items_insert_failed", itemsError);
      await admin.from("orders").delete().eq("id", order.id);
      return { success: false, error: "Захиалгын бүтээгдэхүүн хадгалахад алдаа гарлаа" };
    }

    // 3. Create QPay invoice
    const callbackUrl =
      process.env.QPAY_CALLBACK_URL ||
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/checkout/callback`;

    const invoice = await createInvoice({
      amount: finalTotal,
      description: `${BRAND.name} захиалга: ${orderNumber}`,
      customerName: `${payload.contact.lastName} ${payload.contact.firstName}`,
      callbackUrl,
    });

    // 4. Save invoice to payment_invoices table with order_id link
    const { error: insertError } = await admin
      .from("payment_invoices")
      .insert({
        id: invoice.id,
        user_id: user.id,
        amount: finalTotal,
        status: "pending",
        order_number: orderNumber,
        order_id: order.id,
        pending_order_data: { items: payload.items, address: payload.address ?? null } as unknown as Json,
      });
    if (insertError) {
      log.error("checkout_invoice_insert_failed", insertError);
      await admin.from("orders").delete().eq("id", order.id);
      return { success: false, error: "Төлбөрийн нэхэмжлэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу." };
    }

    return {
      success: true,
      data: { invoice, orderNumber, orderId: order.id },
    };
  } catch (err) {
    log.error("checkout_invoice_unexpected_error", err);
    return {
      success: false,
      error: "Нэхэмжлэл үүсгэхэд алдаа гарлаа",
    };
  }
}

export async function createLendMNCheckoutInvoice(
  payload: CreateLendMNCheckoutInvoicePayload,
): Promise<
  | { success: true; data: { invoiceId: string; invoiceNumber: string; orderNumber: string; orderId: string } }
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

    const itemsTotal = payload.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryFee = await calculateDeliveryFee(admin, payload.address.city, itemsTotal);
    const couponDiscount = payload.couponDiscount ?? 0;
    const pointDiscount = payload.pointDiscount ?? 0;
    const finalTotal = itemsTotal + deliveryFee - couponDiscount - pointDiscount;

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        status: "pending",
        payment_status: "unpaid",
        payment_method: "lendmn",
        total_amount: finalTotal,
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
      log.error("lendmn_invoice_order_creation_failed", orderError);
      return { success: false, error: "Захиалга үүсгэхэд алдаа гарлаа" };
    }

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
      log.error("lendmn_invoice_items_insert_failed", itemsError);
      await admin.from("orders").delete().eq("id", order.id);
      return { success: false, error: "Захиалгын бүтээгдэхүүн хадгалахад алдаа гарлаа" };
    }

    const lendmnCallbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/checkout/lendmn-callback`;
    const result = await createLendMNInvoice({
      amount: finalTotal,
      description: `${BRAND.name} захиалга: ${orderNumber}`,
      phoneNumber: payload.phoneNumber,
      orderNumber,
      userId: user.id,
      callbackUrl: lendmnCallbackUrl,
      pendingOrderData: { items: payload.items, address: payload.address ?? null },
      orderId: order.id,
    });

    return {
      success: true,
      data: {
        invoiceId: result.invoiceId,
        invoiceNumber: result.invoiceNumber,
        orderNumber: result.orderNumber,
        orderId: order.id,
      },
    };
  } catch (err) {
    log.error("lendmn_invoice_unexpected_error", err);
    return {
      success: false,
      error: "LendMN нэхэмжлэл үүсгэхэд алдаа гарлаа",
    };
  }
}

export async function createStorePayCheckoutInvoice(
  payload: CreateStorePayCheckoutInvoicePayload,
): Promise<
  | { success: true; data: { invoiceId: string; loanId: number; orderNumber: string; orderId: string } }
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
    const admin = createAdminClient();

    await ensurePublicUser(admin, user);

    const itemsCheck = await validateOrderItems(admin, payload.items);
    if (!itemsCheck.valid) {
      return { success: false, error: itemsCheck.error };
    }

    const itemsTotal = payload.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryFee = await calculateDeliveryFee(admin, payload.address.city, itemsTotal);
    const couponDiscount = payload.couponDiscount ?? 0;
    const finalTotal = itemsTotal + deliveryFee - couponDiscount;

    if (finalTotal < STOREPAY_MIN_AMOUNT) {
      return {
        success: false,
        error: `StorePay хуваарь төлөлт ${STOREPAY_MIN_AMOUNT.toLocaleString()}₮-с дээш дүнд боломжтой`,
      };
    }

    const orderNumber = generateOrderNumber();

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        status: "pending",
        payment_status: "unpaid",
        payment_method: "storepay",
        total_amount: finalTotal,
        delivery_fee: deliveryFee,
        delivery_city: payload.address.city,
        delivery_district: payload.address.district,
        delivery_sub_district: payload.address.sub_district,
        delivery_detail: payload.address.detail,
        coupon_id: payload.couponId ?? null,
        coupon_discount: couponDiscount,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      log.error("storepay_invoice_order_creation_failed", orderError);
      return { success: false, error: "Захиалга үүсгэхэд алдаа гарлаа" };
    }

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
      log.error("storepay_invoice_items_insert_failed", itemsError);
      await admin.from("orders").delete().eq("id", order.id);
      return { success: false, error: "Захиалгын бүтээгдэхүүн хадгалахад алдаа гарлаа" };
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/checkout/storepay-callback`;

    const result = await createStorePayInvoice({
      amount: finalTotal,
      description: `${BRAND.name} захиалга: ${orderNumber}`,
      mobileNumber: payload.phoneNumber,
      orderNumber,
      userId: user.id,
      callbackUrl,
      pendingOrderData: { items: payload.items, address: payload.address ?? null },
      orderId: order.id,
    });

    return {
      success: true,
      data: {
        invoiceId: result.invoiceId,
        loanId: result.loanId,
        orderNumber: result.orderNumber,
        orderId: order.id,
      },
    };
  } catch (err) {
    log.error("storepay_invoice_unexpected_error", err);
    const msg = err instanceof Error ? err.message : "";
    let userError: string;

    if (msg.includes("env vars missing")) {
      userError = "StorePay тохиргоо алдаатай байна. Админд хандана уу";
    } else if (msg.includes("auth failed")) {
      userError = "StorePay нэвтрэлт амжилтгүй боллоо. Түр хүлээгээд дахин оролдоно уу";
    } else if (msg.includes("TimeoutError") || msg.includes("timed out") || msg.includes("abort")) {
      userError = "StorePay серверийн хариу удааширлаа. Түр хүлээгээд дахин оролдоно уу";
    } else if (msg.includes("StorePay API error")) {
      userError = "StorePay үйлчилгээ түр ажиллахгүй байна. Түр хүлээгээд дахин оролдоно уу";
    } else if (msg.includes("Failed to save invoice")) {
      userError = "Нэхэмжлэл хадгалахад алдаа гарлаа. Дахин оролдоно уу";
    } else if (msg.includes("Failed to fetch") || msg.includes("ECONNREFUSED") || msg.includes("network")) {
      userError = "Сүлжээний алдаа гарлаа. Интернет холболтоо шалгана уу";
    } else if (msg) {
      userError = msg;
    } else {
      userError = "StorePay нэхэмжлэл үүсгэхэд алдаа гарлаа";
    }

    return { success: false, error: userError };
  }
}

interface CreateInvoiceForOrderResult {
  success: boolean;
  data?: {
    invoice: QPayInvoiceData;
    orderNumber: string;
    orderId: string;
    totalAmount: number;
  };
  error?: string;
}

export async function createInvoiceForExistingOrder(
  orderId: string,
): Promise<CreateInvoiceForOrderResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Нэвтэрч орно уу" };
  }

  const admin = createAdminClient();

  // 1. Get the existing order
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, order_number, total_amount, user_id, payment_status, points_used, coupon_discount, coupon_id")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: "Захиалга олдсонгүй" };
  }

  if (order.user_id !== user.id) {
    return { success: false, error: "Зөвшөөрөлгүй" };
  }

  if (order.payment_status === "paid") {
    return { success: false, error: "Захиалга аль хэдийн төлөгдсөн" };
  }

  // Re-validate stock / active status before letting the user pay. An
  // unpaid order can sit in history for days; if a product went
  // inactive or out of stock in the meantime we must not generate a
  // new invoice — paying would decrement already-zero inventory and
  // oversell on delivery.
  const { data: orderItems, error: itemsReadError } = await admin
    .from("order_items")
    .select("product_id, variant_id, quantity, variant_name, products(name)")
    .eq("order_id", orderId);

  if (itemsReadError || !orderItems || orderItems.length === 0) {
    return { success: false, error: "Захиалгын бараанууд олдсонгүй" };
  }

  const itemsForValidation: OrderItemPayload[] = orderItems.map((row) => {
    // `products` join can come back as an array or a single row
    // depending on PostgREST relationship inference — flatten both.
    const productRel = Array.isArray(row.products)
      ? row.products[0]
      : row.products;
    return {
      productId: row.product_id,
      name: productRel?.name ?? row.variant_name ?? "Бүтээгдэхүүн",
      price: 0, // unused by validateOrderItems
      quantity: row.quantity,
      variantId: row.variant_id,
      variantName: row.variant_name ?? null,
    };
  });

  const validation = await validateOrderItems(admin, itemsForValidation);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  // Cancel any existing pending invoices for this order
  await admin
    .from("payment_invoices")
    .update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .eq("status", "pending");

  // 2. Get user info for invoice
  const { data: userData } = await admin
    .from("users")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  const customerName = userData
    ? `${userData.last_name ?? ""} ${userData.first_name ?? ""}`.trim()
    : "Customer";

  // 3. Calculate full price (remove any previously applied discounts)
  const pointDiscount = order.points_used ?? 0;
  const couponDiscount = order.coupon_discount ?? 0;
  const fullPrice = order.total_amount + pointDiscount + couponDiscount;

  // 4. Create new QPay invoice with full price (no discounts on retry)
  try {
    const callbackUrl =
      process.env.QPAY_CALLBACK_URL ||
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/checkout/callback`;

    const invoice = await createInvoice({
      amount: fullPrice,
      description: `${BRAND.name} захиалга: ${order.order_number}`,
      customerName,
      callbackUrl,
    });

    // 5. Save invoice to payment_invoices table
    await admin.from("payment_invoices").insert({
      id: invoice.id,
      user_id: user.id,
      amount: fullPrice,
      status: "pending",
      order_number: order.order_number,
      order_id: order.id,
    });

    // 6. Update order: set full price and clear discounts
    await admin
      .from("orders")
      .update({
        payment_status: "pending",
        total_amount: fullPrice,
        points_used: 0,
        coupon_discount: 0,
        coupon_id: null,
      })
      .eq("id", orderId);

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
    return {
      success: false,
      error: "Нэхэмжлэл үүсгэхэд алдаа гарлаа",
    };
  }
}
