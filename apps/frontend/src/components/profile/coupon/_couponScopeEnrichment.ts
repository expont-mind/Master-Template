import type { CouponData } from "@/components/profile/CouponCard";

export const SCOPE_JUNCTION: Record<string, { table: string; idField: string; refTable: string }> =
  {
    product: {
      table: "coupon_products",
      idField: "product_id",
      refTable: "products",
    },
    category: {
      table: "coupon_categories",
      idField: "category_id",
      refTable: "categories",
    },
    brand: { table: "coupon_brands", idField: "brand_id", refTable: "brands" },
  };

// `config.table`/`refTable` are runtime strings, so the junction query is
// intentionally untyped at the boundary; result rows are narrowed to a
// Record shape.
type JunctionRow = { coupon_id: string } & Record<string, { name?: string } | string>;

type UntypedClient = {
  from: (table: string) => {
    select: (cols: string) => {
      in: (column: string, values: string[]) => PromiseLike<{ data: JunctionRow[] | null }>;
    };
  };
};

/**
 * Enrich `scope_item_names` on each scoped coupon by fetching junction rows
 * (one query per scope type). Mutates the input coupons in place — matches
 * the previous inline behavior in CouponContent.
 */
export async function enrichCouponsWithScopeNames(
  coupons: CouponData[],
  supabase: unknown,
): Promise<void> {
  const untypedFrom = supabase as UntypedClient;

  for (const [scopeType, config] of Object.entries(SCOPE_JUNCTION)) {
    const scopedCoupons = coupons.filter((c) => c.scope === scopeType);
    if (scopedCoupons.length === 0) continue;

    const couponIds = scopedCoupons.map((c) => c.coupon_id);
    const { data: junctions } = await untypedFrom
      .from(config.table)
      .select(`coupon_id, ${config.idField}, ${config.refTable}(name)`)
      .in("coupon_id", couponIds);

    for (const c of scopedCoupons) {
      const items = (junctions ?? []).filter((j) => j.coupon_id === c.coupon_id);
      c.scope_item_names = items
        .map((j) => {
          const ref = j[config.refTable];
          return typeof ref === "object" && ref !== null ? ref.name : undefined;
        })
        .filter((n): n is string => Boolean(n));
    }
  }
}
