// Internal helpers shared across the create*Invoice server actions. Not
// server actions themselves (no `"use server"` directive) — they take an
// admin Supabase client as a parameter and run inside the parent action.

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/utils/logger";

import { calculateDeliveryFee, ensurePublicUser, validateOrderItems } from "./_internal";
import { validateAddress, type OrderItemPayload } from "./_shared";

import type { Json } from "@/types/database";
import type { User } from "@supabase/supabase-js";

type AdminClient = ReturnType<typeof createAdminClient>;

interface CheckoutAddress {
  city: string;
  district: string;
  sub_district: string;
  detail: string;
}

export type ActionFailure = { success: false; error: string };

/**
 * Auth + items + address gate. Used at the top of every create*Invoice flow.
 */
export async function ensureCheckoutContext(payload: {
  items?: OrderItemPayload[];
  address: CheckoutAddress;
}): Promise<{ ok: true; user: User } | { ok: false; failure: ActionFailure }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, failure: { success: false, error: "Нэвтэрч орно уу" } };
  }
  if (!payload.items || payload.items.length === 0) {
    return {
      ok: false,
      failure: { success: false, error: "Сагс хоосон байна" },
    };
  }
  const addrCheck = validateAddress(payload.address);
  if (!addrCheck.valid) {
    return {
      ok: false,
      failure: { success: false, error: addrCheck.error },
    };
  }
  return { ok: true, user };
}

/**
 * Set up the admin client, ensure public.users row exists, validate cart
 * items against the live products table. Returns the admin client on success.
 */
export async function prepareAdminWithValidation(
  user: User,
  items: OrderItemPayload[],
): Promise<{ ok: true; admin: AdminClient } | { ok: false; failure: ActionFailure }> {
  const admin = createAdminClient();
  await ensurePublicUser(admin, user);
  const itemsCheck = await validateOrderItems(admin, items);
  if (!itemsCheck.valid) {
    return {
      ok: false,
      failure: { success: false, error: itemsCheck.error },
    };
  }
  return { ok: true, admin };
}

interface PriceBreakdown {
  itemsTotal: number;
  deliveryFee: number;
  couponDiscount: number;
  pointDiscount: number;
  finalTotal: number;
}

/**
 * Reduce items into totals + apply delivery fee + coupon + points. Mirrors the
 * client-side pricing calculator but stays server-authoritative.
 */
export async function computeInvoiceTotals(
  admin: AdminClient,
  payload: {
    items: OrderItemPayload[];
    address: CheckoutAddress;
    couponDiscount?: number;
    pointDiscount?: number;
  },
): Promise<PriceBreakdown> {
  const itemsTotal = payload.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = await calculateDeliveryFee(admin, payload.address.city, itemsTotal);
  const couponDiscount = payload.couponDiscount ?? 0;
  const pointDiscount = payload.pointDiscount ?? 0;
  const finalTotal = itemsTotal + deliveryFee - couponDiscount - pointDiscount;
  return { itemsTotal, deliveryFee, couponDiscount, pointDiscount, finalTotal };
}

interface CreateOrderInput {
  admin: AdminClient;
  user: User;
  orderNumber: string;
  paymentMethod: "qpay" | "lendmn" | "storepay";
  payload: {
    items: OrderItemPayload[];
    address: CheckoutAddress;
    couponId?: string | null;
    pointsUsed?: number;
  };
  totals: PriceBreakdown;
  logScope: string;
}

/**
 * Create the orders row + order_items rows atomically. Rolls back the orders
 * row if the items insert fails. Returns the created order id on success.
 */
export async function createOrderWithItems(
  input: CreateOrderInput,
): Promise<{ ok: true; orderId: string } | { ok: false; failure: ActionFailure }> {
  const { admin, user, orderNumber, paymentMethod, payload, totals } = input;

  const orderRow = {
    user_id: user.id,
    order_number: orderNumber,
    status: "pending" as const,
    payment_status: "unpaid" as const,
    payment_method: paymentMethod,
    total_amount: totals.finalTotal,
    delivery_fee: totals.deliveryFee,
    delivery_city: payload.address.city,
    delivery_district: payload.address.district,
    delivery_sub_district: payload.address.sub_district,
    delivery_detail: payload.address.detail,
    points_used: payload.pointsUsed ?? 0,
    coupon_id: payload.couponId ?? null,
    coupon_discount: totals.couponDiscount,
  };

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert(orderRow)
    .select("id")
    .single();

  if (orderError || !order) {
    log.error(`${input.logScope}_order_creation_failed`, orderError);
    return {
      ok: false,
      failure: { success: false, error: "Захиалга үүсгэхэд алдаа гарлаа" },
    };
  }

  const orderItems = payload.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    variant_id: item.variantId ?? null,
    variant_name: item.variantName ?? null,
    price: item.price,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await admin.from("order_items").insert(orderItems);

  if (itemsError) {
    log.error(`${input.logScope}_items_insert_failed`, itemsError);
    await admin.from("orders").delete().eq("id", order.id);
    return {
      ok: false,
      failure: {
        success: false,
        error: "Захиалгын бүтээгдэхүүн хадгалахад алдаа гарлаа",
      },
    };
  }

  return { ok: true, orderId: order.id };
}

/**
 * Build the pending_order_data payload stored on payment_invoices so the
 * webhook can reconstruct the order if anything went wrong.
 */
export function buildPendingOrderData(payload: {
  items: OrderItemPayload[];
  address: CheckoutAddress;
}): Json {
  return {
    items: payload.items,
    address: payload.address ?? null,
  } as unknown as Json;
}

// Table-driven dispatch for StorePay error → Mongolian message. Order matters:
// first entry whose substrings match the raw error message wins.
const STOREPAY_ERROR_RULES: ReadonlyArray<{
  substrings: readonly string[];
  message: string;
}> = [
  {
    substrings: ["env vars missing"],
    message: "StorePay тохиргоо алдаатай байна. Админд хандана уу",
  },
  {
    substrings: ["auth failed"],
    message: "StorePay нэвтрэлт амжилтгүй боллоо. Түр хүлээгээд дахин оролдоно уу",
  },
  {
    substrings: ["TimeoutError", "timed out", "abort"],
    message: "StorePay серверийн хариу удааширлаа. Түр хүлээгээд дахин оролдоно уу",
  },
  {
    substrings: ["StorePay API error"],
    message: "StorePay үйлчилгээ түр ажиллахгүй байна. Түр хүлээгээд дахин оролдоно уу",
  },
  {
    substrings: ["Failed to save invoice"],
    message: "Нэхэмжлэл хадгалахад алдаа гарлаа. Дахин оролдоно уу",
  },
  {
    substrings: ["Failed to fetch", "ECONNREFUSED", "network"],
    message: "Сүлжээний алдаа гарлаа. Интернет холболтоо шалгана уу",
  },
];

/**
 * Translate a StorePay SDK error into a user-facing Mongolian message. The
 * StorePay client throws with specific substrings we can pattern-match on;
 * unknown errors fall through to the generic message.
 */
export function mapStorePayError(err: unknown): string {
  const msg = err instanceof Error ? err.message : "";
  const match = STOREPAY_ERROR_RULES.find((rule) => rule.substrings.some((s) => msg.includes(s)));
  if (match) return match.message;
  return msg || "StorePay нэхэмжлэл үүсгэхэд алдаа гарлаа";
}
