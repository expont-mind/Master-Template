import type { SortOption } from "./useProductList";

interface BuildFiltersInput {
  debouncedSearch: string;
  statusFilter: string;
  stockFilter: string;
  discountFilter: string;
  categoryFilter: string;
  brandFilter: string;
  dateFrom: string;
  dateTo: string;
}

/**
 * Builds the serverFilters map for product list queries.
 * Pure function — same inputs → same outputs.
 */
export function buildProductServerFilters(input: BuildFiltersInput): Record<string, string> {
  const {
    debouncedSearch,
    statusFilter,
    stockFilter,
    discountFilter,
    categoryFilter,
    brandFilter,
    dateFrom,
    dateTo,
  } = input;

  const filters: Record<string, string> = {};
  // Use search_words for multi-word search (all words must match)
  if (debouncedSearch) filters["search_words"] = debouncedSearch;
  if (statusFilter !== "all") filters["status.eq"] = statusFilter;
  if (stockFilter === "out") filters["stock_quantity.eq"] = "0";
  if (stockFilter === "low") {
    filters["stock_quantity.lt"] = "10";
    filters["stock_quantity.gt"] = "0";
  }
  if (stockFilter === "in_stock") filters["stock_quantity.gte"] = "10";
  if (discountFilter === "has") filters["discount_price.gt"] = "0";
  if (discountFilter === "none") {
    filters["discount_price.is"] = "null";
  }
  if (categoryFilter !== "all") filters["category_id"] = categoryFilter;
  if (brandFilter !== "all") filters["brand_id.eq"] = brandFilter;
  if (dateFrom) {
    filters["created_at.gte"] = new Date(`${dateFrom}T00:00:00+08:00`).toISOString();
  }
  if (dateTo) {
    filters["created_at.lte"] = new Date(`${dateTo}T23:59:59.999+08:00`).toISOString();
  }
  return filters;
}

export const SORT_ORDER_MAP: Record<SortOption, string> = {
  newest: "created_at.desc",
  oldest: "created_at.asc",
  az: "name.asc",
  za: "name.desc",
  price_asc: "price.asc",
  price_desc: "price.desc",
  discount_asc: "discount_price.asc.nullslast",
  discount_desc: "discount_price.desc.nullslast",
  updated_desc: "updated_at.desc",
  updated_asc: "updated_at.asc",
};
