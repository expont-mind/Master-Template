"use server";

import { BRAND } from "@/lib/utils/brand-config";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInvoice, checkPayment } from "@/lib/qpay/client";
import { resolvePaymentWallet } from "@/lib/qpay/utils";
import { createLendMNInvoice, getLendMNInvoiceStatus } from "@/lib/lendmn/client";
import { createStorePayInvoice, getStorePayInvoiceStatus } from "@/lib/storepay/client";
import type { QPayInvoiceData } from "@/lib/qpay/types";
import type { Json } from "@/types/database";
import { STOREPAY_MIN_AMOUNT } from "@/lib/utils/constants";
import { logPaymentEvent } from "@/lib/payment-logger";
import type { User } from "@supabase/supabase-js";

/**
 * Ensure a public.users row exists for the given auth user.
 * Fixes rare cases where the auth trigger silently fails,
 * causing FK violations on orders.user_id -> public.users(id).
 */
async function ensurePublicUser(
  admin: ReturnType<typeof createAdminClient>,
  user: User,
): Promise<void> {
  const { data } = await admin
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) {
    const meta = user.user_metadata ?? {};
    await admin.from("users").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        first_name:
          meta.first_name ?? meta.given_name ??
          ((meta.full_name || meta.name || "").split(" ")[0] || null),
        last_name:
          meta.last_name ?? meta.family_name ??
          ((meta.full_name || meta.name || "").split(" ").slice(1).join(" ") || null),
        primary_phone: user.phone?.replace(/^\+?976/, "") ?? null,
        avatar_url: meta.avatar_url ?? meta.picture ?? null,
      },
      { onConflict: "id" },
    );
  }
}

interface ContactPayload {
  firstName: string;
  lastName: string;
  phone1: string;
  phone2: string;
}

export async function saveContact(contact: ContactPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Нэвтэрч орно уу" };
  }

  const { error } = await supabase
    .from("users")
    .update({
      first_name: contact.firstName,
      last_name: contact.lastName,
      primary_phone: contact.phone1.replace(/^\+?976/, ""),
      secondary_phone: contact.phone2 ? contact.phone2.replace(/^\+?976/, "") : "",
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: "Холбоо барих мэдээлэл хадгалахад алдаа гарлаа" };
  }

  return { success: true };
}

// -- Update payment method on existing order --

export async function updateOrderPaymentMethod(
  orderId: string,
  paymentMethod: "qpay" | "transfer",
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Нэвтэрч орно уу" };
  }

  const admin = createAdminClient();

  // DB trigger (set_paid_at_on_payment) automatically handles paid_at:
  // - transfer + unpaid → paid_at = created_at (appears among paid orders)
  // - switching away from transfer → paid_at = NULL
  // - payment confirmed → paid_at = NOW()
  const { error } = await admin
    .from("orders")
    .update({ payment_method: paymentMethod })
    .eq("id", orderId)
    .eq("user_id", user.id)
    .eq("payment_status", "unpaid");

  if (error) {
    return { success: false, error: "Төлбөрийн хэлбэр өөрчлөхөд алдаа гарлаа" };
  }

  return { success: true };
}

// -- Invoice creation (no order yet) --

/**
 * Generate a random alphanumeric order number (e.g., "W5F041J6").
 *
 * Uses crypto.getRandomValues for the random portion so two requests
 * within the same millisecond can't collide on a Math.random() seed.
 * Format: 4-char base36 timestamp (least-significant ms bits) + 4 chars
 * from a 32-byte cryptographic random pool.
 */
function generateOrderNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(8);
  // crypto is available in both Node 18+ and the browser; no import needed.
  crypto.getRandomValues(bytes);
  let result = "";
  // Use only the first 4 bytes for the visible suffix; the rest provides
  // extra entropy in case any single byte is constrained.
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(bytes[i] % chars.length);
  }
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  return ts + result;
}

interface DeliveryAddressPayload {
  city: string;
  district: string;
  sub_district: string;
  detail: string;
}

// -- Server-side validation helpers --

function validateAddress(
  address: DeliveryAddressPayload | undefined,
): { valid: true } | { valid: false; error: string } {
  if (!address) {
    return { valid: false, error: "Хүргэлтийн хаяг оруулна уу" };
  }
  if (!address.city?.trim()) {
    return { valid: false, error: "Хот/Аймаг сонгоно уу" };
  }
  if (!address.district?.trim()) {
    return { valid: false, error: "Дүүрэг/Сум сонгоно уу" };
  }
  if (!address.sub_district?.trim()) {
    return { valid: false, error: "Хороо/Баг сонгоно уу" };
  }
  if (!address.detail?.trim()) {
    return { valid: false, error: "Дэлгэрэнгүй хаяг оруулна уу" };
  }
  return { valid: true };
}

async function validateOrderItems(
  admin: ReturnType<typeof createAdminClient>,
  items: OrderItemPayload[],
): Promise<{ valid: true } | { valid: false; error: string }> {
  const productIds = [...new Set(items.map((i) => i.productId))];
  const variantIds = items
    .map((i) => i.variantId)
    .filter((id): id is string => id != null);
  const uniqueVariantIds = [...new Set(variantIds)];

  const [productsResult, variantsResult, activeVariantsResult] =
    await Promise.all([
      admin
        .from("products")
        .select("id, name, is_active, stock_quantity")
        .in("id", productIds),
      uniqueVariantIds.length > 0
        ? admin
            .from("product_variants")
            .select("id, product_id, name, stock_quantity, status")
            .in("id", uniqueVariantIds)
        : Promise.resolve({ data: [] as { id: string; product_id: string; name: string | null; stock_quantity: number; status: string }[] }),
      admin
        .from("product_variants")
        .select("product_id")
        .in("product_id", productIds)
        .eq("status", "active"),
    ]);

  const productMap = new Map(
    (productsResult.data ?? []).map((p) => [p.id, p]),
  );
  const variantMap = new Map(
    (variantsResult.data ?? []).map((v) => [v.id, v]),
  );
  const productsWithVariants = new Set(
    (activeVariantsResult.data ?? []).map((v) => v.product_id),
  );

  const errors: string[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product || !product.is_active) {
      errors.push(`"${item.name}" бүтээгдэхүүн олдсонгүй эсвэл идэвхгүй байна`);
      continue;
    }

    if (productsWithVariants.has(item.productId) && !item.variantId) {
      errors.push(`"${item.name}" бүтээгдэхүүний хувилбар сонгогдоогүй байна`);
      continue;
    }

    if (item.variantId) {
      const variant = variantMap.get(item.variantId);
      if (!variant || variant.status !== "active") {
        errors.push(`"${item.name}" бүтээгдэхүүний сонгосон хувилбар олдсонгүй`);
        continue;
      }
      if (variant.stock_quantity <= 0) {
        errors.push(`"${item.name}" дууссан байна`);
      } else if (variant.stock_quantity < item.quantity) {
        errors.push(
          `"${item.name}" ${variant.stock_quantity} ширхэг үлдсэн (${item.quantity} ширхэг захиалсан)`,
        );
      }
    } else {
      if (product.stock_quantity <= 0) {
        errors.push(`"${item.name}" дууссан байна`);
      } else if (product.stock_quantity < item.quantity) {
        errors.push(
          `"${item.name}" ${product.stock_quantity} ширхэг үлдсэн (${item.quantity} ширхэг захиалсан)`,
        );
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join(". ") };
  }

  return { valid: true };
}

// -- Server-side delivery fee calculation --

async function calculateDeliveryFee(
  admin: ReturnType<typeof createAdminClient>,
  city: string,
  itemsTotal: number,
): Promise<number> {
  const { data: zones } = await admin
    .from("delivery_zones")
    .select("*")
    .eq("is_active", true);

  if (!zones || zones.length === 0) return 0;

  const activeZone =
    city === "Улаанбаатар"
      ? zones.find((z) => z.name === "Улаанбаатар")
      : zones.find((z) => z.name === "Орон нутаг");

  if (!activeZone) return 0;

  if (
    activeZone.is_free_delivery_enabled &&
    activeZone.free_delivery_threshold != null &&
    itemsTotal >= activeZone.free_delivery_threshold
  ) {
    return 0;
  }

  return activeZone.delivery_fee;
}

interface CreateCheckoutInvoicePayload {
  total: number;
  couponId?: string | null;
  couponDiscount?: number;
  pointsUsed?: number;
  pointDiscount?: number;
  contact: {
    firstName: string;
    lastName: string;
  };
  items: OrderItemPayload[];
  address: DeliveryAddressPayload;
}

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

  // Validate address
  const addrCheck = validateAddress(payload.address);
  if (!addrCheck.valid) {
    return { success: false, error: addrCheck.error };
  }

  try {
    // Generate order number for this transaction
    const orderNumber = generateOrderNumber();
    const admin = createAdminClient();

    // Ensure public.users row exists (fixes rare FK violation)
    await ensurePublicUser(admin, user);

    // Validate stock and variant requirements
    const itemsCheck = await validateOrderItems(admin, payload.items);
    if (!itemsCheck.valid) {
      return { success: false, error: itemsCheck.error };
    }

    // Calculate delivery fee server-side
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
      console.error("[createCheckoutInvoice] Order creation error:", orderError);
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
      console.error("[createCheckoutInvoice] Order items error:", itemsError);
      // Cleanup: delete the order if items failed
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
      console.error("[createCheckoutInvoice] Invoice insert error:", insertError);
      // Cleanup: delete the orphaned order
      await admin.from("orders").delete().eq("id", order.id);
      return { success: false, error: "Төлбөрийн нэхэмжлэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу." };
    }

    return {
      success: true,
      data: { invoice, orderNumber, orderId: order.id },
    };
  } catch (err) {
    console.error("[createCheckoutInvoice] Error:", err);
    return {
      success: false,
      error: "Нэхэмжлэл үүсгэхэд алдаа гарлаа",
    };
  }
}

// -- Free order creation (totalPayable === 0) --

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

  // Validate address
  const addrCheck = validateAddress(payload.address);
  if (!addrCheck.valid) {
    return { success: false, error: addrCheck.error };
  }

  try {
    const orderNumber = generateOrderNumber();
    const admin = createAdminClient();

    // Ensure public.users row exists (fixes rare FK violation)
    await ensurePublicUser(admin, user);

    // Validate stock and variant requirements
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
      console.error("[createFreeOrder] Order creation error:", orderError);
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
      console.error("[createFreeOrder] Order items error:", itemsError);
      await admin.from("orders").delete().eq("id", order.id);
      return { success: false, error: "Захиалгын бүтээгдэхүүн хадгалахад алдаа гарлаа" };
    }

    // 3. Decrement stock
    try {
      const db = admin as any;
      await db.rpc("decrement_order_stock", { p_order_id: order.id });
      await db.from("orders").update({ stock_decremented: true }).eq("id", order.id);
    } catch (err) {
      console.error("[createFreeOrder] Stock decrement error:", err);
    }

    // 4. Record coupon usage if applicable
    if (payload.couponId && couponDiscount > 0) {
      await recordCouponUsage(admin, user.id, order.id, payload.couponId, couponDiscount);
    }

    // 5. Record point usage if applicable
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
    console.error("[createFreeOrder] Error:", err);
    return {
      success: false,
      error: "Захиалга үүсгэхэд алдаа гарлаа",
    };
  }
}

// -- LendMN Invoice creation --

interface CreateLendMNCheckoutInvoicePayload {
  total: number;
  couponId?: string | null;
  couponDiscount?: number;
  pointsUsed?: number;
  pointDiscount?: number;
  contact: {
    firstName: string;
    lastName: string;
  };
  phoneNumber: string;
  items: OrderItemPayload[];
  address: DeliveryAddressPayload;
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

  // Validate address
  const addrCheck = validateAddress(payload.address);
  if (!addrCheck.valid) {
    return { success: false, error: addrCheck.error };
  }

  try {
    const orderNumber = generateOrderNumber();
    const admin = createAdminClient();

    // Ensure public.users row exists (fixes rare FK violation)
    await ensurePublicUser(admin, user);

    // Validate stock and variant requirements
    const itemsCheck = await validateOrderItems(admin, payload.items);
    if (!itemsCheck.valid) {
      return { success: false, error: itemsCheck.error };
    }

    // Calculate delivery fee server-side
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
      console.error("[createLendMNCheckoutInvoice] Order creation error:", orderError);
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
      console.error("[createLendMNCheckoutInvoice] Order items error:", itemsError);
      // Cleanup: delete the order if items failed
      await admin.from("orders").delete().eq("id", order.id);
      return { success: false, error: "Захиалгын бүтээгдэхүүн хадгалахад алдаа гарлаа" };
    }

    // 3. Create LendMN invoice
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
    console.error("[createLendMNCheckoutInvoice] Error:", err);
    return {
      success: false,
      error: "LendMN нэхэмжлэл үүсгэхэд алдаа гарлаа",
    };
  }
}

// -- StorePay Invoice creation --

interface CreateStorePayCheckoutInvoicePayload {
  total: number;
  couponId?: string | null;
  couponDiscount?: number;
  contact: {
    firstName: string;
    lastName: string;
  };
  phoneNumber: string;
  items: OrderItemPayload[];
  address: DeliveryAddressPayload;
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

  // Validate address
  const addrCheck = validateAddress(payload.address);
  if (!addrCheck.valid) {
    return { success: false, error: addrCheck.error };
  }

  try {
    const admin = createAdminClient();

    // Ensure public.users row exists (fixes rare FK violation)
    await ensurePublicUser(admin, user);

    // Validate stock and variant requirements
    const itemsCheck = await validateOrderItems(admin, payload.items);
    if (!itemsCheck.valid) {
      return { success: false, error: itemsCheck.error };
    }

    // Calculate delivery fee server-side
    const itemsTotal = payload.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryFee = await calculateDeliveryFee(admin, payload.address.city, itemsTotal);
    const couponDiscount = payload.couponDiscount ?? 0;
    const finalTotal = itemsTotal + deliveryFee - couponDiscount;

    // StorePay minimum amount check
    if (finalTotal < STOREPAY_MIN_AMOUNT) {
      return {
        success: false,
        error: `StorePay хуваарь төлөлт ${STOREPAY_MIN_AMOUNT.toLocaleString()}₮-с дээш дүнд боломжтой`,
      };
    }

    const orderNumber = generateOrderNumber();

    // 1. Create order with pending status FIRST
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
      console.error("[createStorePayCheckoutInvoice] Order creation error:", orderError);
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
      console.error("[createStorePayCheckoutInvoice] Order items error:", itemsError);
      await admin.from("orders").delete().eq("id", order.id);
      return { success: false, error: "Захиалгын бүтээгдэхүүн хадгалахад алдаа гарлаа" };
    }

    // 3. Create StorePay invoice
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
    console.error("[createStorePayCheckoutInvoice] Error:", err);
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
      // StorePay-аас ирсэн тодорхой алдаа (жнь: утас бүртгэлгүй)
      userError = msg;
    } else {
      userError = "StorePay нэхэмжлэл үүсгэхэд алдаа гарлаа";
    }

    return { success: false, error: userError };
  }
}

// -- Create invoice for existing unpaid order --

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

  // Verify order belongs to user
  if (order.user_id !== user.id) {
    return { success: false, error: "Зөвшөөрөлгүй" };
  }

  // Check if order is already paid
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
    console.error("[createInvoiceForExistingOrder] Error:", err);
    return {
      success: false,
      error: "Нэхэмжлэл үүсгэхэд алдаа гарлаа",
    };
  }
}

// -- Payment status check (polls our DB first, falls back to provider API) --

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
          // Update invoice status
          await admin
            .from("payment_invoices")
            .update({
              status: "paid",
              paid_amount: result.amount ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", invoiceId);

          // Update order status via idempotent RPC
          await admin.rpc("create_order_from_invoice", { p_invoice_id: invoiceId });

          return { success: true, paid: true };
        }
      }

      return { success: true, paid: false };
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : "unknown";
      console.error("[checkPayment] LendMN check error:", rawMsg);
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

            // Update order status via idempotent RPC
            const { error: rpcErr } = await admin.rpc("create_order_from_invoice", {
              p_invoice_id: invoiceId,
            });
            if (rpcErr) {
              console.error("[checkPayment] StorePay RPC error:", rpcErr, { invoiceId });
              logPaymentEvent({ invoiceId, provider: "storepay", event: "poll_rpc_error", message: rpcErr.message });
            }
          } catch (e) {
            console.error("[checkPayment] StorePay DB/RPC error:", e, { invoiceId });
            logPaymentEvent({ invoiceId, provider: "storepay", event: "poll_db_rpc_error", message: e instanceof Error ? e.message : String(e) });
          }
          return { success: true, paid: true };
        }
      }

      return { success: true, paid: false };
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : "unknown";
      console.error("[checkPayment] StorePay check error:", rawMsg);
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
      // Update our DB so future checks are instant
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

        // Update order status via idempotent RPC
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
    console.error("[checkPayment] QPay check error:", rawMsg);
    logPaymentEvent({ invoiceId, provider: "qpay", event: "poll_check_error", message: rawMsg });
    return {
      success: false,
      error: "Төлбөр шалгахад алдаа гарлаа",
    };
  }
}

// -- Validate cart items (check products still active) --

interface OrderItemPayload {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variantId?: string | null;
  variantName?: string | null;
}

export async function validateCartItems(
  items: OrderItemPayload[],
): Promise<
  | { valid: true }
  | { valid: false; unavailableItems: string[]; error: string }
> {
  if (!items || items.length === 0) {
    return { valid: false, unavailableItems: [], error: "Сагс хоосон байна" };
  }

  const admin = createAdminClient();
  const productIds = [...new Set(items.map((i) => i.productId))];
  const variantIds = items
    .map((i) => i.variantId)
    .filter((id): id is string => id != null);
  const uniqueVariantIds = [...new Set(variantIds)];

  // Previously this only checked `is_active`, letting users land on
  // the checkout page with stock-0 items and only discover the
  // problem after filling the address and hitting "pay". Now it
  // mirrors the full validateOrderItems check (product active +
  // variant active + stock ≥ requested qty) so the warning surfaces
  // the moment the page loads.
  const [productsResult, variantsResult] = await Promise.all([
    admin
      .from("products")
      .select("id, name, is_active, stock_quantity")
      .in("id", productIds),
    uniqueVariantIds.length > 0
      ? admin
          .from("product_variants")
          .select("id, stock_quantity, status")
          .in("id", uniqueVariantIds)
      : Promise.resolve({
          data: [] as { id: string; stock_quantity: number; status: string }[],
        }),
  ]);

  const productMap = new Map(
    (productsResult.data ?? []).map((p) => [p.id, p]),
  );
  const variantMap = new Map(
    (variantsResult.data ?? []).map((v) => [v.id, v]),
  );

  const unavailable: string[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product || !product.is_active) {
      unavailable.push(item.name);
      continue;
    }

    if (item.variantId) {
      const variant = variantMap.get(item.variantId);
      if (
        !variant ||
        variant.status !== "active" ||
        variant.stock_quantity < item.quantity
      ) {
        unavailable.push(item.name);
        continue;
      }
    } else if (product.stock_quantity < item.quantity) {
      unavailable.push(item.name);
    }
  }

  if (unavailable.length > 0) {
    return {
      valid: false,
      unavailableItems: unavailable,
      error: `Дараах бүтээгдэхүүн нөөц хүрэлцэхгүй эсвэл идэвхгүй: ${unavailable.join(", ")}`,
    };
  }

  return { valid: true };
}

// -- Order creation after payment confirmed --

interface CreateOrderPayload {
  invoiceId: string;
  items: OrderItemPayload[];
  total: number;
  couponId?: string | null;
  couponDiscount?: number;
  pointsUsed?: number;
  pointDiscount?: number;
}

// -- Recover pending invoices for returning users --

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

  // Find paid invoices where the linked order is still pending/unpaid
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

  // Also check pending invoices without order_id (legacy)
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
      // For paid invoices with an order_id, check if the order still needs updating
      const orderId = "order_id" in inv ? (inv as { order_id: string | null }).order_id : null;
      if (orderId) {
        const { data: order } = await admin
          .from("orders")
          .select("status, payment_status")
          .eq("id", orderId)
          .single();

        // Skip if order is already confirmed and paid
        if (order?.status === "confirmed" && order?.payment_status === "paid") continue;

        // Call RPC to update the order
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

      // Payment confirmed — create order via idempotent RPC
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

// -- Record coupon usage after payment --

async function recordCouponUsage(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  orderId: string,
  couponId: string,
  discountAmount: number,
) {
  try {
    // Tables not in frontend TS types — use untyped access
    const db = admin as any;

    // Validate usage limits before recording
    const { data: coupon } = await db
      .from("coupons")
      .select("usage_count, usage_limit, usage_limit_per_user")
      .eq("id", couponId)
      .single();

    if (coupon) {
      // Check global usage limit
      if (coupon.usage_limit && (coupon.usage_count ?? 0) >= coupon.usage_limit) {
        console.warn("[recordCouponUsage] Global usage limit reached");
        return;
      }

      // Check per-user usage limit
      const perUserLimit = coupon.usage_limit_per_user ?? 1;
      const { count } = await db
        .from("coupon_usages")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", couponId)
        .eq("user_id", userId);

      if ((count ?? 0) >= perUserLimit) {
        console.warn("[recordCouponUsage] Per-user usage limit reached");
        return;
      }
    }

    // Insert into coupon_usages
    await db.from("coupon_usages").insert({
      coupon_id: couponId,
      user_id: userId,
      order_id: orderId,
      discount_amount: discountAmount,
    });

    // Increment usage_count on the coupon
    if (coupon) {
      await db
        .from("coupons")
        .update({ usage_count: (coupon.usage_count ?? 0) + 1 })
        .eq("id", couponId);
    }
  } catch (err) {
    console.error("[recordCouponUsage] Error:", err);
    // Non-critical — payment is already confirmed
  }
}

// -- Record point usage after payment --

async function recordPointUsage(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  orderId: string,
  orderNumber: string,
  pointsUsed: number,
) {
  try {
    const db = admin as any;

    // Idempotency: skip if already recorded for this order
    const { data: existing } = await db
      .from("point_transactions")
      .select("id")
      .eq("order_id", orderId)
      .eq("type", "used")
      .maybeSingle();

    if (existing) return;

    // Verify balance is sufficient
    const { data } = await db
      .from("point_transactions")
      .select("amount")
      .eq("user_id", userId);

    const balance = (data ?? []).reduce(
      (sum: number, t: { amount: number }) => sum + t.amount,
      0,
    );

    if (balance < pointsUsed) {
      console.warn("[recordPointUsage] Insufficient point balance");
      return;
    }

    await db.from("point_transactions").insert({
      user_id: userId,
      order_id: orderId,
      type: "used",
      amount: -pointsUsed,
      description: `Захиалга #${orderNumber}`,
    });
  } catch (err) {
    console.error("[recordPointUsage] Error:", err);
  }
}

// -- Award points for completed order --

async function awardPointsForOrder(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  orderId: string,
  orderNumber: string,
  orderTotal: number,
) {
  try {
    const pointsEarned = Math.floor(orderTotal * 0.02); // 2% of order total
    if (pointsEarned <= 0) return;

    const db = admin as any;

    // Idempotency: skip if already awarded for this order
    const { data: existing } = await db
      .from("point_transactions")
      .select("id")
      .eq("order_id", orderId)
      .eq("type", "earned")
      .maybeSingle();

    if (existing) return;

    await db.from("point_transactions").insert({
      user_id: userId,
      order_id: orderId,
      type: "earned",
      amount: pointsEarned,
      description: `Захиалга #${orderNumber}`,
    });
  } catch (err) {
    console.error("[awardPointsForOrder] Error:", err);
  }
}

// -- Update order status after payment confirmed --

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
    // Check if order is already confirmed
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
          console.error("[createOrderAfterPayment] RPC error:", rpcErr);
          await logPaymentEvent({ invoiceId: payload.invoiceId, orderId: existingOrder.id, event: "order_confirm_rpc_error", message: rpcErr.message });
          return { success: false, error: "Захиалга баталгаажуулахад алдаа гарлаа" };
        }

        const rpcResult = rpcData as { success: boolean; error?: string } | null;
        if (rpcResult && !rpcResult.success) {
          console.error("[createOrderAfterPayment] RPC failure:", rpcResult.error);
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

        // Record coupon usage if applicable (idempotent)
        if (payload.couponId && payload.couponDiscount) {
          await recordCouponUsage(admin, user.id, result.order_id, payload.couponId, payload.couponDiscount);
        }

        // Record point usage and award points (idempotent)
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

  // Ensure public.users row exists (fixes rare FK violation)
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

  // Record coupon usage if applicable (idempotent)
  if (payload.couponId && payload.couponDiscount) {
    await recordCouponUsage(admin, user.id, newOrder.id, payload.couponId, payload.couponDiscount);
  }

  // Record point usage and award points (idempotent)
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
