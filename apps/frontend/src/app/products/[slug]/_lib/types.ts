import type {
  OptionGroup,
  ProductBrand,
  ProductDetail,
  ProductRichDescription,
} from "@/lib/queries/products";
import type { Product } from "@/types/database";

export type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

/**
 * Shape returned by `fetchProductForMetadata` — a hydrated Product with
 * the fields needed for both `generateMetadata` and the client component.
 * Mirrors `ProductWithDetails` plus the server-only review aggregates.
 */
export type MetadataProduct = Product & {
  images: string[];
  product_details: ProductDetail[];
  brand: ProductBrand | null;
  category: { name: string; slug: string } | null;
  reviewCount: number;
  averageRating: number;
  variants?: Array<{
    id: string;
    name: string | null;
    sku: string | null;
    description: string | null;
    price: number;
    discount_price: number | null;
    stock_quantity: number;
    is_default: boolean;
    option_values: string[] | null;
    images: string[];
  }>;
  rich_description?: ProductRichDescription;
  categoryPath?: CategoryItem[];
  option_groups?: OptionGroup[];
};
