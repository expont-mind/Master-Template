export interface PerfRow {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
  status: string;
  qty_sold: number;
  revenue: number;
  stock: number;
  variant_count: number;
  avg_rating: number | null;
  review_count: number;
  total_count: number;
}

export interface VariantSalesRow {
  variant_id: string;
  variant_name: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  qty_sold: number;
  revenue: number;
}

export const PAGE_SIZE = 20;

export const SORT_COLUMN_MAP: Record<string, string> = {
  name: "name",
  price: "price",
  qtySold: "qty_sold",
  revenue: "revenue",
  stock: "stock",
  variantCount: "variant_count",
  avgRating: "avg_rating",
};
