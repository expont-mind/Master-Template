import { createClient } from "@/lib/supabase/client";

export const REVIEWS_PAGE_SIZE = 3;

export const reviewKeys = {
  all: ["reviews"] as const,
  list: (productId: string, rating?: number | null) =>
    [...reviewKeys.all, "list", productId, rating ?? "all"] as const,
  summary: (productId: string) =>
    [...reviewKeys.all, "summary", productId] as const,
  canReview: (productId: string, userId: string) =>
    [...reviewKeys.all, "canReview", productId, userId] as const,
};

export interface ReviewWithUser {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  images: string[] | null;
  status: string;
  created_at: string;
  users: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface ReviewsPage {
  data: ReviewWithUser[];
  nextPage: number | null;
}

export interface ReviewSummary {
  averageRating: number;
  totalCount: number;
  commentCount: number;
  distribution: { stars: number; percentage: number }[];
}

export async function getReviews(
  productId: string,
  page: number = 0,
  rating?: number | null,
): Promise<ReviewsPage> {
  const supabase = createClient();
  const from = page * REVIEWS_PAGE_SIZE;
  const to = from + REVIEWS_PAGE_SIZE - 1;

  let query = supabase
    .from("reviews")
    .select(
      "id, user_id, product_id, rating, comment, images, status, created_at, users(first_name, last_name, avatar_url)",
    )
    .eq("product_id", productId)
    .eq("status", "active")
    .not("comment", "is", null);

  if (rating) {
    query = query.eq("rating", rating);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const reviews = (data ?? []) as unknown as ReviewWithUser[];
  const nextPage = reviews.length === REVIEWS_PAGE_SIZE ? page + 1 : null;

  return { data: reviews, nextPage };
}

export async function getReviewSummary(
  productId: string,
): Promise<ReviewSummary> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("rating, comment")
    .eq("product_id", productId)
    .eq("status", "active");

  if (error) throw error;

  const reviews = data ?? [];
  const totalCount = reviews.length;
  const commentCount = reviews.filter((r) => r.comment !== null).length;

  if (totalCount === 0) {
    return {
      averageRating: 0,
      totalCount: 0,
      commentCount: 0,
      distribution: [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        percentage: 0,
      })),
    };
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = Math.round((sum / totalCount) * 10) / 10;

  const counts = [0, 0, 0, 0, 0];
  for (const r of reviews) {
    counts[r.rating - 1]++;
  }

  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    percentage:
      totalCount > 0 ? Math.round((counts[stars - 1] / totalCount) * 100) : 0,
  }));

  return { averageRating, totalCount, commentCount, distribution };
}

export async function checkCanReview(
  productId: string,
  userId: string,
): Promise<boolean> {
  if (!productId || !userId) return false;

  const supabase = createClient();

  // Check if user already reviewed this product
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .limit(1);

  if (existingReview && existingReview.length > 0) return false;

  // Check if user has a delivered order containing this product
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_items!inner(product_id)")
    .eq("user_id", userId)
    .eq("delivery_status", "delivered")
    .eq("order_items.product_id", productId)
    .limit(1);

  if (error) return false;

  return (data?.length ?? 0) > 0;
}

/**
 * Check which products in an order the user can still review.
 * Returns the first unreviewable product ID, or null if all are reviewed.
 */
export async function checkCanReviewAny(
  productIds: string[],
  userId: string,
): Promise<string | null> {
  if (productIds.length === 0 || !userId) return null;

  const supabase = createClient();

  const { data: existingReviews } = await supabase
    .from("reviews")
    .select("product_id")
    .eq("user_id", userId)
    .in("product_id", productIds);

  const reviewedIds = new Set(
    (existingReviews ?? []).map((r) => r.product_id),
  );
  return productIds.find((id) => !reviewedIds.has(id)) ?? null;
}
