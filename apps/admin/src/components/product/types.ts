import type { ProductStatus } from "@/types/database";

export interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

export interface ProductVariant {
  id: string;
  sku: string | null;
  name: string | null;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  is_default: boolean;
  status: string;
  option_values: string[] | null;
}

export interface ProductImage {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  variant_id: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  discount_price: number | null;
  stock_quantity: number | null;
  status: ProductStatus;
  brand_id: string | null;
  original_url: string | null;
  metadata: { option_groups?: OptionGroup[] } | null;
  created_at: string;
  updated_at: string;
  brands: { id: string; name: string } | null;
  product_variants?: ProductVariant[];
  product_images: ProductImage[];
  product_categories?: {
    category_id: string;
    categories: { id: string; name: string } | null;
  }[];
}

export const VARIANT_DETAIL_TYPES = [
  "Хэмжээ",
  "Хадгалалт",
  "Хэрэглэх заавар",
  "Хэрэглэх үеийн анхааруулга",
  "Үйлчилгээ",
  "Орц найрлага",
  "Боломжит гаж нөлөө",
  "Хэнд тохирох",
  "Хадгалах хугацаа",
] as const;

export type VariantDetailType = (typeof VARIANT_DETAIL_TYPES)[number];

export interface VariantDetail {
  id: string;
  type: VariantDetailType | "";
  content: string;
}

export interface VariantForm {
  id: string;
  sku: string;
  name: string;
  price: string;
  discountPrice: string;
  stockQuantity: string;
  attributes: { [key: string]: string };
  images: string[];
  details: VariantDetail[];
}

export interface AttributeValue {
  id: string;
  value: string;
  display_value: string;
  color_hex: string | null;
}

export interface Attribute {
  id: string;
  name: string;
  display_name: string;
  values: AttributeValue[];
}

// Option group types for multi-option products
export const OPTION_TYPES = [
  "Хэмжээ",
  "Өнгө",
  "Үнэр",
  "Төрөл",
  "Материал",
  "Загвар",
  "Багц",
] as const;

export type OptionType = (typeof OPTION_TYPES)[number] | string;

export interface OptionGroup {
  id: string;
  type: OptionType;
  values: string[];
  is_required: boolean;
}

export interface GeneratedVariant {
  id: string;
  combination: string; // e.g., "12 / 12" or "S / Red"
  optionValues: string[];
  price: string;
  discountPrice: string;
  stockQuantity: string;
  sku: string;
  status: "active" | "inactive";
  imageUrl: string;
}
