import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Env ─────────────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const QUICKPAY_API_URL = Deno.env.get("QUICKPAY_API_URL")!;
const QUICKPAY_API_KEY = Deno.env.get("QUICKPAY_API_KEY")!;
const QUICKPAY_MERCHANT_ID = Deno.env.get("QUICKPAY_MERCHANT_ID")!;
const QUICKPAY_MCC_CODE = Deno.env.get("QUICKPAY_MCC_CODE") || "5812";
const QUICKPAY_BANK_CODE = Deno.env.get("QUICKPAY_BANK_CODE") || "050000";
const QUICKPAY_ACCOUNT_NUMBER = Deno.env.get("QUICKPAY_ACCOUNT_NUMBER")!;
const QUICKPAY_ACCOUNT_NAME = Deno.env.get("QUICKPAY_ACCOUNT_NAME")!;
const QPAY_CALLBACK_URL = Deno.env.get("QPAY_CALLBACK_URL")!;

// ─── CORS ────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Types ───────────────────────────────────────────────────────
interface OrderItemPayload {
  productId: string;
  variantId?: string | null;
  variantName?: string | null;
  price: number;
  quantity: number;
}

interface DeliveryAddress {
  city: string;
  district: string;
  sub_district: string;
  detail: string;
}

interface RequestBody {
  total: number;
  contact: { firstName: string; lastName: string };
  items: OrderItemPayload[];
  address: DeliveryAddress;
  paymentMethod: "qpay"; // Only QPay handled here; LendMN uses lendmn-debit
  existingOrderId?: string; // For retry payment on existing unpaid orders
  pointsUsed?: number;
  pointDiscount?: number;
  couponId?: string | null;
  couponDiscount?: number;
}

interface QPayInvoiceData {
  id: string;
  qr_image: string;
  qr_text: string;
  urls: { name: string; description: string; logo: string; link: string }[];
}

// ─── Helpers ─────────────────────────────────────────────────────

/** 8-char order number: 4-char timestamp prefix + 4 random alphanumeric. */
function generateOrderNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  return ts + result.slice(0, 4);
}

function validateAddress(
  addr: DeliveryAddress
): { valid: true } | { valid: false; error: string } {
  if (!addr.city) return { valid: false, error: "Хот/Аймаг сонгоно уу" };
  if (!addr.district) return { valid: false, error: "Дүүрэг/Сум сонгоно уу" };
  if (!addr.sub_district)
    return { valid: false, error: "Хороо/Баг сонгоно уу" };
  if (!addr.detail?.trim())
    return { valid: false, error: "Дэлгэрэнгүй хаяг оруулна уу" };
  return { valid: true };
}

/** Ensure public.users row exists for the given auth user (fixes rare FK violation). */
async function ensurePublicUser(
  admin: ReturnType<typeof createClient>,
  user: { id: string; email?: string | null; phone?: string | null; user_metadata?: Record<string, string> }
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
        primary_phone: user.phone ?? null,
        avatar_url: meta.avatar_url ?? meta.picture ?? null,
      },
      { onConflict: "id" },
    );
  }
}

/** Validate products are active and have enough stock. Matches web actions.ts:174-257.
 *  Single batched implementation: products + variants + activeVariants in
 *  parallel, then iterate. Mirrors web exactly so behaviour is identical
 *  whether checkout flows through this edge function or the web actions. */
async function validateOrderItems(
  admin: ReturnType<typeof createClient>,
  items: OrderItemPayload[]
): Promise<{ valid: true } | { valid: false; error: string }> {
  const productIds = [...new Set(items.map((i) => i.productId))];
  const variantIds = [
    ...new Set(
      items
        .map((i) => i.variantId)
        .filter((id): id is string => id != null)
    ),
  ];

  const [productsResult, variantsResult, activeVariantsResult] =
    await Promise.all([
      admin
        .from("products")
        .select("id, name, is_active, stock_quantity")
        .in("id", productIds),
      variantIds.length > 0
        ? admin
            .from("product_variants")
            .select("id, product_id, name, stock_quantity, status")
            .in("id", variantIds)
        : Promise.resolve({ data: [] as Array<{ id: string; product_id: string; name: string | null; stock_quantity: number; status: string }> }),
      admin
        .from("product_variants")
        .select("product_id")
        .in("product_id", productIds)
        .eq("status", "active"),
    ]);

  const products = productsResult.data ?? [];
  if (products.length === 0) {
    return { valid: false, error: "Бүтээгдэхүүн уншихад алдаа гарлаа" };
  }

  const productMap = new Map<string, { id: string; name: string; is_active: boolean; stock_quantity: number }>(
    products.map((p: { id: string; name: string; is_active: boolean; stock_quantity: number }) => [p.id, p])
  );
  const variantMap = new Map<string, { id: string; product_id: string; name: string | null; stock_quantity: number; status: string }>(
    (variantsResult.data ?? []).map((v: { id: string; product_id: string; name: string | null; stock_quantity: number; status: string }) => [v.id, v])
  );
  const productsWithVariants = new Set(
    (activeVariantsResult.data ?? []).map((v: { product_id: string }) => v.product_id)
  );

  for (const item of items) {
    const product = productMap.get(item.productId);
    const productName = product?.name ?? item.productId;

    if (!product || !product.is_active) {
      return {
        valid: false,
        error: `"${productName}" бүтээгдэхүүн олдсонгүй эсвэл идэвхгүй байна`,
      };
    }

    // If product has any active variant, a variant MUST be selected.
    if (productsWithVariants.has(item.productId) && !item.variantId) {
      return {
        valid: false,
        error: `"${productName}" бүтээгдэхүүний хувилбар сонгогдоогүй байна`,
      };
    }

    if (item.variantId) {
      const variant = variantMap.get(item.variantId);
      if (!variant || variant.status !== "active") {
        return {
          valid: false,
          error: `"${productName}" бүтээгдэхүүний сонгосон хувилбар олдсонгүй`,
        };
      }
      if (variant.stock_quantity <= 0) {
        return { valid: false, error: `"${productName}" дууссан байна` };
      }
      if (variant.stock_quantity < item.quantity) {
        return {
          valid: false,
          error: `"${productName}" ${variant.stock_quantity} ширхэг үлдсэн (${item.quantity} ширхэг захиалсан)`,
        };
      }
    } else {
      // No variant — check product-level stock.
      if (product.stock_quantity <= 0) {
        return { valid: false, error: `"${productName}" дууссан байна` };
      }
      if (product.stock_quantity < item.quantity) {
        return {
          valid: false,
          error: `"${productName}" ${product.stock_quantity} ширхэг үлдсэн (${item.quantity} ширхэг захиалсан)`,
        };
      }
    }
  }

  return { valid: true };
}

/** Look up delivery fee for the given city. Matches web's calculateDeliveryFee. */
async function calculateDeliveryFee(
  admin: ReturnType<typeof createClient>,
  city: string,
  itemsTotal: number
): Promise<number> {
  const { data: zones } = await admin
    .from("delivery_zones")
    .select("*")
    .eq("is_active", true);

  if (!zones || zones.length === 0) return 0;

  const activeZone =
    city === "Улаанбаатар"
      ? zones.find((z: { name: string }) => z.name === "Улаанбаатар")
      : zones.find((z: { name: string }) => z.name === "Орон нутаг");

  if (!activeZone) return 0;

  if (
    activeZone.is_free_delivery_enabled &&
    activeZone.free_delivery_threshold != null &&
    itemsTotal >= activeZone.free_delivery_threshold
  ) {
    return 0;
  }

  return activeZone.delivery_fee ?? 0;
}

async function createQPayInvoice(
  amount: number,
  description: string,
  customerName: string
): Promise<QPayInvoiceData> {
  const url = `${QUICKPAY_API_URL}/api/qpay/invoices`;
  const payload = {
    merchant_id: QUICKPAY_MERCHANT_ID,
    amount,
    currency: "MNT",
    mcc_code: QUICKPAY_MCC_CODE,
    description,
    callback_url: QPAY_CALLBACK_URL,
    customer_name: customerName,
    bank_accounts: [
      {
        account_bank_code: QUICKPAY_BANK_CODE,
        account_number: QUICKPAY_ACCOUNT_NUMBER,
        account_name: QUICKPAY_ACCOUNT_NAME,
        is_default: true,
      },
    ],
  };
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${QUICKPAY_API_KEY}`,
    "X-QPay-Merchant-Id": QUICKPAY_MERCHANT_ID,
  };

  // Retry up to 3 times for transient network failures
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[createQPayInvoice] attempt ${attempt}, url=${url}`);
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.error?.message || `QPay нэхэмжлэл үүсгэхэд алдаа гарлаа: ${res.status}`
        );
      }
      return json.data as QPayInvoiceData;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(
        `[createQPayInvoice] attempt ${attempt} failed:`,
        lastError.message
      );
      // Only retry on network errors (fetch failed), not on API errors
      if (!lastError.message.includes("fetch failed") && !lastError.message.includes("error sending request")) {
        throw lastError;
      }
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  throw lastError ?? new Error("QPay серверт холбогдож чадсангүй");
}

// ─── Free-order handler (total = 0, fully paid by points/coupon) ──
// Matches web's createFreeOrder() in actions.ts:445-575.

async function handleFreeOrder(
  admin: ReturnType<typeof createClient>,
  userId: string,
  body: RequestBody,
  orderNumber: string
): Promise<Response> {
  // Compute delivery fee server-side so the persisted value is authoritative.
  const itemsTotal = body.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0,
  );
  const deliveryFee = await calculateDeliveryFee(
    admin,
    body.address.city,
    itemsTotal,
  );

  // 1. Create order directly as confirmed/paid
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: userId,
      order_number: orderNumber,
      status: "confirmed",
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      payment_method: "free",
      total_amount: 0,
      delivery_fee: deliveryFee,
      points_used: body.pointsUsed ?? 0,
      coupon_id: body.couponId ?? null,
      coupon_discount: body.couponDiscount ?? 0,
      delivery_city: body.address.city,
      delivery_district: body.address.district,
      delivery_sub_district: body.address.sub_district,
      delivery_detail: body.address.detail,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("[handleFreeOrder] Order creation error:", orderError);
    return new Response(
      JSON.stringify({ success: false, error: "Захиалга үүсгэхэд алдаа гарлаа" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 2. Create order items
  const orderItems = body.items.map((item) => ({
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
    console.error("[handleFreeOrder] Order items error:", itemsError);
    await admin.from("orders").delete().eq("id", order.id);
    return new Response(
      JSON.stringify({ success: false, error: "Захиалгын бүтээгдэхүүн хадгалахад алдаа гарлаа" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 3. Decrement stock
  try {
    await admin.rpc("decrement_order_stock", { p_order_id: order.id });
    await admin.from("orders").update({ stock_decremented: true }).eq("id", order.id);
  } catch (err) {
    console.error("[handleFreeOrder] Stock decrement error:", err);
  }

  // 4. Record coupon usage if applicable (matches web's recordCouponUsage)
  if (body.couponId && (body.couponDiscount ?? 0) > 0) {
    try {
      const db = admin as ReturnType<typeof createClient>;
      const { data: coupon } = await db
        .from("coupons")
        .select("usage_count, usage_limit, usage_limit_per_user")
        .eq("id", body.couponId)
        .single();

      let canRecord = true;
      if (coupon) {
        if (coupon.usage_limit && (coupon.usage_count ?? 0) >= coupon.usage_limit) {
          console.warn("[handleFreeOrder] Coupon global usage limit reached");
          canRecord = false;
        } else {
          const perUserLimit = coupon.usage_limit_per_user ?? 1;
          const { count } = await db
            .from("coupon_usages")
            .select("id", { count: "exact", head: true })
            .eq("coupon_id", body.couponId)
            .eq("user_id", userId);
          if ((count ?? 0) >= perUserLimit) {
            console.warn("[handleFreeOrder] Coupon per-user usage limit reached");
            canRecord = false;
          }
        }
      }

      if (canRecord) {
        await db.from("coupon_usages").insert({
          coupon_id: body.couponId,
          user_id: userId,
          order_id: order.id,
          discount_amount: body.couponDiscount,
        });
        if (coupon) {
          await db
            .from("coupons")
            .update({ usage_count: (coupon.usage_count ?? 0) + 1 })
            .eq("id", body.couponId);
        }
      }
    } catch (err) {
      console.error("[handleFreeOrder] Coupon usage error:", err);
    }
  }

  // 5. Record point usage if applicable
  if ((body.pointsUsed ?? 0) > 0) {
    try {
      await admin.rpc("record_point_usage", {
        p_user_id: userId,
        p_order_id: order.id,
        p_order_number: orderNumber,
        p_points_used: body.pointsUsed,
      });
    } catch (err) {
      console.error("[handleFreeOrder] Point usage error:", err);
    }
  }

  // 6. Award points (2% of 0 = 0, but call for consistency)
  try {
    await admin.rpc("award_points_for_order", {
      p_user_id: userId,
      p_order_id: order.id,
      p_order_number: orderNumber,
      p_order_total: 0,
    });
  } catch (err) {
    console.error("[handleFreeOrder] Award points error:", err);
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        invoice: null,
        orderNumber,
        orderId: order.id,
        isFree: true,
      },
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── Retry handler for existing unpaid orders ───────────────────
// Matches web's createInvoiceForExistingOrder() in actions.ts:651-760

async function handleExistingOrderRetry(
  admin: ReturnType<typeof createClient>,
  userId: string,
  existingOrderId: string,
  contact: { firstName: string; lastName: string }
): Promise<Response> {
  // 1. Get the existing order
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, order_number, total_amount, user_id, payment_status, points_used, coupon_discount, coupon_id")
    .eq("id", existingOrderId)
    .single();

  if (orderError || !order) {
    return new Response(
      JSON.stringify({ success: false, error: "Захиалга олдсонгүй" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Verify order belongs to user
  if (order.user_id !== userId) {
    return new Response(
      JSON.stringify({ success: false, error: "Зөвшөөрөлгүй" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if order is already paid
  if (order.payment_status === "paid") {
    return new Response(
      JSON.stringify({ success: false, error: "Захиалга аль хэдийн төлөгдсөн" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Re-validate stock / active status before letting the user pay. An
  // unpaid order can sit in history for days; if a product went inactive
  // or out of stock in the meantime we must NOT generate a new invoice —
  // paying would decrement already-zero inventory and oversell on delivery.
  // Mirrors web's createInvoiceForExistingOrder() in actions.ts:931-967.
  const { data: orderItemsRows, error: itemsReadError } = await admin
    .from("order_items")
    .select("product_id, variant_id, variant_name, quantity")
    .eq("order_id", existingOrderId);

  if (itemsReadError || !orderItemsRows || orderItemsRows.length === 0) {
    return new Response(
      JSON.stringify({ success: false, error: "Захиалгын бараанууд олдсонгүй" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const itemsForValidation: OrderItemPayload[] = orderItemsRows.map(
    (row: { product_id: string; variant_id: string | null; variant_name: string | null; quantity: number }) => ({
      productId: row.product_id,
      variantId: row.variant_id ?? null,
      variantName: row.variant_name ?? null,
      price: 0, // unused by validateOrderItems
      quantity: row.quantity,
    })
  );

  const itemsCheck = await validateOrderItems(admin, itemsForValidation);
  if (!itemsCheck.valid) {
    return new Response(
      JSON.stringify({ success: false, error: itemsCheck.error }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Cancel any existing pending invoices for this order
  await admin
    .from("payment_invoices")
    .update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("order_id", existingOrderId)
    .eq("status", "pending");

  // 2. Calculate full price (remove any previously applied discounts)
  const pointDiscount = order.points_used ?? 0;
  const couponDiscount = order.coupon_discount ?? 0;
  const fullPrice = order.total_amount + pointDiscount + couponDiscount;

  const customerName = `${contact.lastName} ${contact.firstName}`.trim() || "Customer";

  // 3. Create new QPay invoice with full price (no discounts on retry)
  const invoice = await createQPayInvoice(
    fullPrice,
    `Monpang захиалга: ${order.order_number}`,
    customerName
  );

  // 4. Save invoice to payment_invoices table
  const { error: insertError } = await admin
    .from("payment_invoices")
    .insert({
      id: invoice.id,
      user_id: userId,
      amount: fullPrice,
      status: "pending",
      order_number: order.order_number,
      order_id: order.id,
    });

  if (insertError) {
    console.error("[handleExistingOrderRetry] Invoice insert error:", insertError);
    return new Response(
      JSON.stringify({ success: false, error: "Нэхэмжлэл үүсгэхэд алдаа гарлаа" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 5. Update order: set full price and clear discounts
  await admin
    .from("orders")
    .update({
      payment_status: "pending",
      total_amount: fullPrice,
      points_used: 0,
      coupon_discount: 0,
      coupon_id: null,
    })
    .eq("id", existingOrderId);

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        invoice,
        orderNumber: order.order_number,
        orderId: order.id,
        totalAmount: fullPrice,
      },
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── Main handler ────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Debug: log all incoming headers
    console.log("[create-checkout-invoice] === REQUEST START ===");
    console.log("[create-checkout-invoice] method:", req.method);
    const headerEntries: string[] = [];
    req.headers.forEach((value, key) => {
      // Mask sensitive values but show presence
      if (key.toLowerCase() === "authorization") {
        headerEntries.push(`${key}: ${value.substring(0, 15)}...${value.substring(value.length - 10)}`);
      } else if (key.toLowerCase() === "apikey") {
        headerEntries.push(`${key}: ${value.substring(0, 10)}...(len=${value.length})`);
      } else {
        headerEntries.push(`${key}: ${value}`);
      }
    });
    console.log("[create-checkout-invoice] headers:", headerEntries.join(" | "));

    // Authenticate user via JWT
    const authHeader = req.headers.get("Authorization");
    console.log("[create-checkout-invoice] authHeader present:", !!authHeader, "length:", authHeader?.length);
    if (!authHeader) {
      console.log("[create-checkout-invoice] NO Authorization header — 401");
      return new Response(
        JSON.stringify({ success: false, error: "Нэвтэрч орно уу" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client for DB operations + user verification
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Verify the user token
    const jwt = authHeader.replace("Bearer ", "");
    console.log("[create-checkout-invoice] JWT length:", jwt.length);
    const authResult = await admin.auth.getUser(jwt).catch((err: unknown) => {
      console.error("[create-checkout-invoice] getUser THREW:", err);
      return null;
    });
    const user = authResult?.data?.user;
    console.log("[create-checkout-invoice] user found:", !!user, "userId:", user?.id);
    if (!user) {
      console.log("[create-checkout-invoice] User null — 401");
      return new Response(
        JSON.stringify({ success: false, error: "Нэвтэрч орно уу" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as RequestBody;

    // Handle retry for existing unpaid order (matching web's createInvoiceForExistingOrder)
    if (body.existingOrderId) {
      return await handleExistingOrderRetry(admin, user.id, body.existingOrderId, body.contact);
    }

    // Validate input
    if (!body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Сагс хоосон байна" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const addrCheck = validateAddress(body.address);
    if (!addrCheck.valid) {
      return new Response(
        JSON.stringify({ success: false, error: addrCheck.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderNumber = generateOrderNumber();

    // Ensure public.users row exists (fixes rare FK violation)
    await ensurePublicUser(admin, user);

    // Validate stock
    const itemsCheck = await validateOrderItems(admin, body.items);
    if (!itemsCheck.valid) {
      return new Response(
        JSON.stringify({ success: false, error: itemsCheck.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Free-order path: skip QPay when total is 0 (e.g., fully paid by points/coupon).
    // Matches web's createFreeOrder() in actions.ts:445-575.
    if ((body.total ?? 0) <= 0) {
      return await handleFreeOrder(admin, user.id, body, orderNumber);
    }

    // Compute delivery fee server-side from delivery_zones so the persisted
    // value matches what the order detail view shows (avoids client-side
    // tampering and ensures an authoritative source).
    const itemsTotal = body.items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );
    const deliveryFee = await calculateDeliveryFee(
      admin,
      body.address.city,
      itemsTotal,
    );

    // 1. Create order (pending/unpaid)
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        status: "pending",
        payment_status: "unpaid",
        payment_method: body.paymentMethod,
        total_amount: body.total,
        delivery_fee: deliveryFee,
        points_used: body.pointsUsed ?? 0,
        coupon_id: body.couponId ?? null,
        coupon_discount: body.couponDiscount ?? 0,
        delivery_city: body.address.city,
        delivery_district: body.address.district,
        delivery_sub_district: body.address.sub_district,
        delivery_detail: body.address.detail,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("[create-checkout-invoice] Order error:", orderError);
      return new Response(
        JSON.stringify({
          success: false,
          error: orderError?.message || "Захиалга үүсгэхэд алдаа гарлаа",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Create order items
    const orderItems = body.items.map((item) => ({
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
      console.error("[create-checkout-invoice] Items error:", itemsError);
      await admin.from("orders").delete().eq("id", order.id);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Захиалгын бүтээгдэхүүн хадгалахад алдаа гарлаа",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Create QPay invoice
    const invoice = await createQPayInvoice(
      body.total,
      `Monpang захиалга: ${orderNumber}`,
      `${body.contact.lastName} ${body.contact.firstName}`
    );

    // 4. Save to payment_invoices with order_id link
    const { error: insertError } = await admin
      .from("payment_invoices")
      .insert({
        id: invoice.id,
        user_id: user.id,
        amount: body.total,
        status: "pending",
        order_number: orderNumber,
        order_id: order.id,
        pending_order_data: {
          items: body.items,
          address: body.address,
        },
      });

    if (insertError) {
      console.error("[create-checkout-invoice] Invoice insert error:", insertError);
      await admin.from("orders").delete().eq("id", order.id);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Төлбөрийн нэхэмжлэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          invoice,
          orderNumber,
          orderId: order.id,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[create-checkout-invoice] Error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Алдаа гарлаа. Дахин оролдоно уу.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
