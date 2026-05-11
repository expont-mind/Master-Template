import type { ContentStatus } from "@/types/database";

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}
