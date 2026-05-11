import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Valid tables that can be accessed via admin API
const VALID_TABLES = [
  "users",
  "products",
  "product_variants",
  "product_images",
  "product_attributes",
  "product_attribute_values",
  "product_attribute_configs",
  "product_variant_attributes",
  "product_details",
  "product_rich_descriptions",
  "product_categories",
  "categories",
  "brands",
  "inventory",
  "orders",
  "order_items",
  "payments",
  "reviews",
  "articles",
  "events",
  "faqs",
  "notifications",
  "addresses",
  "wishlists",
  "wishlist_items",
  "admins",
  "admin_login_emails",
  "roles",
  "permissions",
  "role_permissions",
  "auth_sessions",
  "delivery_zones",
  "social_links",
  "policies",
  // New tables for admin features
  "banners",
  "coupons",
  "coupon_products",
  "coupon_categories",
  "coupon_brands",
  "coupon_usages",
  "user_coupons",
  "bank_accounts",
  "branches",
  "branch_inventory",
  "ads",
  "about_sections",
  "team_members",
  "sms_campaigns",
  "sms_logs",
  "stock_history",
  "settings",
  "warehouses",
  "warehouse_inventory",
  "admin_notifications",
  // `payment_invoices` intentionally removed: it carries wallet/PII
  // fields. It is still reachable as a *join* from orders (PostgREST
  // resolves the nested select) but direct top-level access via
  // `/api/admin/payment_invoices` is no longer allowed.
  "payment_logs",
  "point_transactions",
  "user_notes",
];

function isValidTable(table: string): boolean {
  return VALID_TABLES.includes(table);
}

// GET /api/admin/[table]
// GET /api/admin/[table]/[id]
// Supports query params: select, order, limit, offset, filters
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const [table, id] = path;

    if (!isValidTable(table)) {
      return NextResponse.json(
        { error: `Invalid table: ${table}` },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;

    // Build query
    const selectParam = searchParams.get("select") || "*";
    const wantCount = searchParams.get("count") === "exact";
    let query = wantCount
      ? supabase.from(table).select(selectParam, { count: "exact" })
      : supabase.from(table).select(selectParam);

    // If ID provided, get single record
    if (id) {
      query = query.eq("id", id);
      const { data, error } = await query.single();
      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: error.code === "PGRST116" ? 404 : 500 },
        );
      }
      return NextResponse.json(data);
    }

    // Apply ordering (supports multiple columns: "paid_at.desc.nullslast,created_at.desc")
    const orderBy = searchParams.get("order");
    if (orderBy) {
      const orderClauses = orderBy.split(",");
      for (const clause of orderClauses) {
        const parts = clause.trim().split(".");
        const column = parts[0];
        const ascending = !parts.includes("desc");
        const nullsFirst = parts.includes("nullsfirst");
        const nullsLast = parts.includes("nullslast");
        query = query.order(column, {
          ascending,
          ...(nullsFirst ? { nullsFirst: true } : {}),
          ...(nullsLast ? { nullsFirst: false } : {}),
        });
      }
    }

    // Apply pagination with hard caps. Previously offset/limit were
    // unbounded so a malformed client (or attacker) could request
    // millions of rows and trigger a slow scan.
    const MAX_OFFSET = 1_000_000;
    const MAX_LIMIT = 500;
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    if (offset !== null) {
      const offsetNum = Math.max(0, Math.min(MAX_OFFSET, parseInt(offset) || 0));
      const limitRaw = parseInt(limit || "100");
      const limitNum = Math.max(
        1,
        Math.min(MAX_LIMIT, Number.isFinite(limitRaw) ? limitRaw : 100),
      );
      query = query.range(offsetNum, offsetNum + limitNum - 1);
    } else if (limit) {
      const limitRaw = parseInt(limit);
      const limitNum = Math.max(
        1,
        Math.min(MAX_LIMIT, Number.isFinite(limitRaw) ? limitRaw : 100),
      );
      query = query.limit(limitNum);
    }

    // Apply multi-word search filter (ALL words must be present in column).
    // Permit any character in the search input — admins type product
    // names verbatim and our catalog is full of `,` `.` `/` `(` `)` `+` etc.
    // Wildcard/escape chars (`%` `_` `\`) are escaped so they can't widen
    // the match or trigger a runaway ilike scan. Per-word length cap is
    // the only DoS guard.
    const escapeLikePattern = (s: string) =>
      s.replace(/[\\%_]/g, (ch) => `\\${ch}`);
    const searchWords = searchParams.get("search_words");
    const searchColumn = searchParams.get("search_column") || "name";
    if (searchWords) {
      const words = searchWords
        .toLowerCase()
        .split(" ")
        .filter((w) => w.length >= 2)
        .map((w) => w.slice(0, 50));
      // Chain ilike filters - all words must match (AND logic)
      for (const word of words) {
        query = query.ilike(searchColumn, `%${escapeLikePattern(word)}%`);
      }
    }

    // Apply search filter for orders (order_number + user name/phone/email).
    // `search` is interpolated into a PostgREST `.or()` filter string so we
    // strip characters that would break the parser or expand the wildcard
    // match (commas, parentheses, percent, underscore).
    const rawSearch = searchParams.get("search");
    const search = rawSearch
      ? rawSearch.replace(/[,()%_*]/g, "").slice(0, 50)
      : null;
    if (search && table === "orders") {
      // Find users matching the search term
      const { data: matchingUsers } = await supabase
        .from("users")
        .select("id")
        .or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,primary_phone.ilike.%${search}%,email.ilike.%${search}%`
        );

      const userIds = (matchingUsers as { id: string }[] | null)?.map((u) => u.id) ?? [];

      if (userIds.length > 0) {
        // PostgREST in.() syntax is brittle when joined manually — UUIDs
        // are safe today but the pattern repeats elsewhere. Cap the
        // expansion so a runaway match set doesn't blow the URL length.
        const capped = userIds.slice(0, 1000);
        query = query.or(
          `order_number.ilike.%${search}%,user_id.in.(${capped.join(",")})`
        );
      } else {
        query = query.ilike("order_number", `%${search}%`);
      }
    } else if (search && table === "users") {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,primary_phone.ilike.%${search}%`
      );
    } else if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    // Filter products by category (via junction table, including all descendant categories)
    const categoryId = searchParams.get("category_id");
    if (categoryId && table === "products") {
      // Get all descendant category IDs (including the selected category itself)
      const { data: allCategories } = await supabase
        .from("categories")
        .select("id, parent_id")
        .eq("is_active", true) as { data: { id: string; parent_id: string | null }[] | null };

      const categoryIds: string[] = [categoryId];
      if (allCategories) {
        // Visited-set guard: a circular parent_id chain (admin-side
        // mistake or malformed import) would otherwise stack-overflow.
        const visited = new Set<string>([categoryId]);
        const findChildren = (parentId: string) => {
          for (const cat of allCategories) {
            if (cat.parent_id === parentId && !visited.has(cat.id)) {
              visited.add(cat.id);
              categoryIds.push(cat.id);
              findChildren(cat.id);
            }
          }
        };
        findChildren(categoryId);
      }

      const { data: productCategories } = await supabase
        .from("product_categories")
        .select("product_id")
        .in("category_id", categoryIds);

      const productIdSet = new Set<string>();
      for (const pc of (productCategories ?? []) as { product_id: string }[]) {
        productIdSet.add(pc.product_id);
      }
      const productIds = [...productIdSet];

      if (productIds.length > 0) {
        query = query.in("id", productIds);
      } else {
        // No products in this category — return empty
        const response = NextResponse.json([]);
        if (wantCount) response.headers.set("X-Total-Count", "0");
        return response;
      }
    }

    // Apply OR filter (e.g. or=payment_status.eq.paid,payment_method.eq.transfer)
    const orFilter = searchParams.get("or");
    if (orFilter) {
      query = query.or(orFilter);
    }

    // Apply filters (eq, neq, gt, lt, gte, lte, like, ilike)
    searchParams.forEach((value, key) => {
      if (
        ["select", "order", "limit", "offset", "count", "search_words", "search_column", "search", "category_id", "or"].includes(
          key,
        )
      )
        return;

      // Parse filter: column.operator=value
      const match = key.match(
        /^(.+)\.(eq|neq|gt|lt|gte|lte|like|ilike|is|in)$/,
      );
      if (match) {
        const [, column, operator] = match;
        switch (operator) {
          case "eq":
            // Handle boolean string values
            if (value === "true") {
              query = query.eq(column, true);
            } else if (value === "false") {
              query = query.eq(column, false);
            } else {
              query = query.eq(column, value);
            }
            break;
          case "neq":
            query = query.neq(column, value);
            break;
          case "gt":
            query = query.gt(column, value);
            break;
          case "lt":
            query = query.lt(column, value);
            break;
          case "gte":
            query = query.gte(column, value);
            break;
          case "lte":
            query = query.lte(column, value);
            break;
          case "like":
            query = query.like(column, value);
            break;
          case "ilike":
            query = query.ilike(column, value);
            break;
          case "is":
            if (value === "not.null") {
              query = query.not(column, "is", null);
            } else {
              query = query.is(
                column,
                value === "null"
                  ? null
                  : value === "true"
                    ? true
                    : value === "false"
                      ? false
                      : null,
              );
            }
            break;
          case "in":
            query = query.in(column, value.split(","));
            break;
        }
      }
    });

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const response = NextResponse.json(data);
    if (wantCount && count !== null && count !== undefined) {
      response.headers.set("X-Total-Count", count.toString());
    }
    return response;
  } catch (error) {
    console.error("Admin API GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/admin/[table]
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const [table] = path;

    if (!isValidTable(table)) {
      return NextResponse.json(
        { error: `Invalid table: ${table}` },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const body = await request.json();

    // Support both single record and array of records
    const isArray = Array.isArray(body);
    const query = supabase.from(table).insert(body).select();

    const { data, error } = isArray ? await query : await query.single();

    if (error) {
      console.error(`Admin API POST ${table} error:`, error);
      const detail = [error.message, error.details, error.hint]
        .filter(Boolean)
        .join(" | ");
      return NextResponse.json({ error: detail || error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Admin API POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/[table]/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const [table, id] = path;

    if (!isValidTable(table)) {
      return NextResponse.json(
        { error: `Invalid table: ${table}` },
        { status: 400 },
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "ID is required for update" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const body = await request.json();

    // Sync is_active when status is updated on products table
    if (table === "products" && body.status !== undefined) {
      body.is_active = body.status === "active";
    }

    // Dynamic table proxy: `table` is validated above by isValidTable
    // but Supabase's typed client can't narrow the union from a runtime
    // string. Cast body to `never` to opt out of column-shape checking;
    // the route is documented as the API surface that bypasses RLS.
    const { data, error } = await supabase
      .from(table)
      .update(body as never)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin API PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/[table]/[id]
// For junction tables like product_categories, use query params: ?product_id=xxx&category_id=yyy
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const [table, id] = path;

    if (!isValidTable(table)) {
      return NextResponse.json(
        { error: `Invalid table: ${table}` },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;

    // Handle junction tables with composite keys
    const junctionTables = [
      "product_categories",
      "wishlist_items",
      "coupon_products",
      "coupon_categories",
      "coupon_brands",
    ];

    if (junctionTables.includes(table)) {
      const productId = searchParams.get("product_id");
      const categoryId = searchParams.get("category_id");
      const couponId = searchParams.get("coupon_id");

      if (table === "product_categories" && productId && categoryId) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("product_id", productId)
          .eq("category_id", categoryId);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }

      // Delete all categories for a product
      if (table === "product_categories" && productId) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("product_id", productId);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }

      // Delete all junction records for a coupon (coupon_products, coupon_categories, coupon_brands)
      if (["coupon_products", "coupon_categories", "coupon_brands"].includes(table) && couponId) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("coupon_id", couponId);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }
    }

    // Standard delete by ID
    if (!id) {
      return NextResponse.json(
        { error: "ID is required for delete" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin API DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
