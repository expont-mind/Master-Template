import type { createAdminClient } from "@/lib/supabase/server";

type AdminClient = ReturnType<typeof createAdminClient>;
type Query = ReturnType<ReturnType<AdminClient["from"]>["select"]>;

const MAX_OFFSET = 1_000_000;
const MAX_LIMIT = 500;
const SPECIAL_PARAMS = new Set([
  "select",
  "order",
  "limit",
  "offset",
  "count",
  "search_words",
  "search_column",
  "search",
  "category_id",
  "or",
]);
const FILTER_REGEX = /^(.+)\.(eq|neq|gt|lt|gte|lte|like|ilike|is|in)$/;

export function applyOrdering(query: Query, orderBy: string | null): Query {
  if (!orderBy) return query;
  let q = query;
  for (const clause of orderBy.split(",")) {
    const parts = clause.trim().split(".");
    const column = parts[0];
    const ascending = !parts.includes("desc");
    const nullsFirst = parts.includes("nullsfirst");
    const nullsLast = parts.includes("nullslast");
    q = q.order(column, {
      ascending,
      ...(nullsFirst ? { nullsFirst: true } : {}),
      ...(nullsLast ? { nullsFirst: false } : {}),
    });
  }
  return q;
}

export function applyPagination(query: Query, limit: string | null, offset: string | null): Query {
  if (offset !== null) {
    const offsetNum = Math.max(0, Math.min(MAX_OFFSET, parseInt(offset) || 0));
    const limitRaw = parseInt(limit || "100");
    const limitNum = Math.max(1, Math.min(MAX_LIMIT, Number.isFinite(limitRaw) ? limitRaw : 100));
    return query.range(offsetNum, offsetNum + limitNum - 1);
  }
  if (limit) {
    const limitRaw = parseInt(limit);
    const limitNum = Math.max(1, Math.min(MAX_LIMIT, Number.isFinite(limitRaw) ? limitRaw : 100));
    return query.limit(limitNum);
  }
  return query;
}

const escapeLikePattern = (s: string): string => s.replace(/[\\%_]/g, (ch) => `\\${ch}`);

/**
 * Multi-word ilike chain (AND semantics): every word must appear in the
 * target column. Permits any character in the search input — admins type
 * product names verbatim and our catalog has `,` `.` `/` `(` `)` `+` etc.
 * Wildcard/escape chars are escaped so they can't widen the match.
 */
export function applyMultiWordSearch(
  query: Query,
  searchWords: string | null,
  searchColumn: string,
): Query {
  if (!searchWords) return query;
  let q = query;
  const words = searchWords
    .toLowerCase()
    .split(" ")
    .filter((w) => w.length >= 2)
    .map((w) => w.slice(0, 50));
  for (const word of words) {
    q = q.ilike(searchColumn, `%${escapeLikePattern(word)}%`);
  }
  return q;
}

/**
 * Free-text search across orders or users. For `orders` we join via the
 * users table for name/phone/email matches; for `users` we OR across four
 * columns; everything else falls back to ilike on `name`.
 */
export async function applySearchByTable(
  query: Query,
  table: string,
  rawSearch: string | null,
  supabase: AdminClient,
): Promise<Query> {
  const search = rawSearch ? rawSearch.replace(/[,()%_*]/g, "").slice(0, 50) : null;
  if (!search) return query;

  if (table === "orders") {
    const { data: matchingUsers } = await supabase
      .from("users")
      .select("id")
      .or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,primary_phone.ilike.%${search}%,email.ilike.%${search}%`,
      );
    const userIds = (matchingUsers as { id: string }[] | null)?.map((u) => u.id) ?? [];
    if (userIds.length > 0) {
      const capped = userIds.slice(0, 1000);
      return query.or(`order_number.ilike.%${search}%,user_id.in.(${capped.join(",")})`);
    }
    return query.ilike("order_number", `%${search}%`);
  }
  if (table === "users") {
    return query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,primary_phone.ilike.%${search}%`,
    );
  }
  return query.ilike("name", `%${search}%`);
}

/**
 * Resolve all descendant category IDs into a list of matching product IDs,
 * then filter the products query to that list. Returns `null` when no
 * products match (caller should short-circuit to an empty response).
 *
 * Visited-set guard: a circular parent_id chain (admin-side mistake) would
 * otherwise stack-overflow.
 */
export async function applyCategoryFilter(
  query: Query,
  table: string,
  categoryId: string | null,
  supabase: AdminClient,
): Promise<{ query: Query; empty: boolean }> {
  if (!categoryId || table !== "products") return { query, empty: false };

  const { data: allCategories } = (await supabase
    .from("categories")
    .select("id, parent_id")
    .eq("is_active", true)) as {
    data: { id: string; parent_id: string | null }[] | null;
  };

  const categoryIds: string[] = [categoryId];
  if (allCategories) {
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

  if (productIds.length === 0) return { query, empty: true };
  return { query: query.in("id", productIds), empty: false };
}

function applyIsFilter(query: Query, column: string, value: string): Query {
  if (value === "not.null") return query.not(column, "is", null);
  const resolved =
    value === "null" ? null : value === "true" ? true : value === "false" ? false : null;
  return query.is(column, resolved);
}

function applyEqFilter(query: Query, column: string, value: string): Query {
  if (value === "true") return query.eq(column, true);
  if (value === "false") return query.eq(column, false);
  return query.eq(column, value);
}

function applySingleOperatorFilter(
  query: Query,
  operator: string,
  column: string,
  value: string,
): Query {
  switch (operator) {
    case "eq":
      return applyEqFilter(query, column, value);
    case "neq":
      return query.neq(column, value);
    case "gt":
      return query.gt(column, value);
    case "lt":
      return query.lt(column, value);
    case "gte":
      return query.gte(column, value);
    case "lte":
      return query.lte(column, value);
    case "like":
      return query.like(column, value);
    case "ilike":
      return query.ilike(column, value);
    case "is":
      return applyIsFilter(query, column, value);
    case "in":
      return query.in(column, value.split(","));
    default:
      return query;
  }
}

/**
 * Apply `column.operator=value` style filters from the URL. Skips the
 * special params (select, order, limit, etc.) that are handled separately
 * above. Unsupported operators are silently ignored.
 */
export function applyOperatorFilters(query: Query, searchParams: URLSearchParams): Query {
  let q = query;
  searchParams.forEach((value, key) => {
    if (SPECIAL_PARAMS.has(key)) return;
    const match = key.match(FILTER_REGEX);
    if (!match) return;
    const [, column, operator] = match;
    q = applySingleOperatorFilter(q, operator, column, value);
  });
  return q;
}
