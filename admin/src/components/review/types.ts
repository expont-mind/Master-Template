import type { ReviewStatus } from "@/types/database";

export interface ReviewWithDetails {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  created_at: string;
  updated_at?: string;
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url?: string | null;
  } | null;
  products: {
    id: string;
    name: string;
    price?: number;
    product_images?: {
      url: string;
      is_primary: boolean;
    }[];
  } | null;
}
