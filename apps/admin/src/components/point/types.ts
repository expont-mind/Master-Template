import type { ContentStatus } from "@/types/database";

export interface PointFaq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  order_id: string | null;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
  users?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    primary_phone: string | null;
  };
}

export interface UserSearchResult {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  primary_phone: string | null;
  point_activated_at: string | null;
}
