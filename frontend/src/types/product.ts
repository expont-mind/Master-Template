// Product-related types extending database types
import type { Product, Category } from "./database";

// Cart item type
export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  variant?: ProductVariant | null;
}

// Product variant (size, color, etc.)
export interface ProductVariant {
  id: string;
  name: string | null;
  sku: string | null;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  is_default?: boolean;
  images?: string[];
  option_values?: string[] | null;
}

// Product with relations
export interface ProductWithCategory extends Product {
  category: Category | null;
}

// Product listing item (minimal data for grids)
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  discount_price: number | null;
  images: string[];
  is_featured: boolean;
  stock_quantity: number;
  category?: {
    name: string;
    slug: string;
  } | null;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  cursor: string | null;
  hasMore: boolean;
  total?: number;
}

// Product filters
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  sort?: "price_asc" | "price_desc" | "newest" | "popular";
  limit?: number;
  offset?: number;
}

// Search suggestion
export interface SearchSuggestion {
  type: "product" | "category" | "query";
  text: string;
  slug?: string;
  image?: string;
}
