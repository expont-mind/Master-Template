export type BannerType = "carousel" | "promo";

export interface Banner {
  id: string;
  image_url: string;
  mobile_image_url: string | null;
  background_color: string;
  mobile_background_color: string | null;
  category_id: string | null;
  product_id: string | null;
  link_url: string | null;
  type: BannerType;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
