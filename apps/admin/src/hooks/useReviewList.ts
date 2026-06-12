"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import { useResetPage } from "./useResetPage";
import { useTableParams } from "./useTableParams";

import type { ReviewWithDetails } from "@/components/review/types";

const PAGE_SIZE = 20;

export function useReviewList() {
  const [searchQuery, setSearchQuery] = useState("");

  const { params, setParam } = useTableParams({
    page: 1,
    status: "all",
    rating: "all",
  });

  const statusFilter = params.status;
  const setStatusFilter = (v: string) => setParam("status", v);
  const ratingFilter = params.rating;
  const setRatingFilter = (v: string) => setParam("rating", v);
  const page = params.page;
  const setPage = (v: number) => setParam("page", v);

  useResetPage(() => setPage(1), [statusFilter, ratingFilter]);

  const serverFilters: Record<string, string> = {};
  if (statusFilter !== "all") serverFilters["status.eq"] = statusFilter;
  if (ratingFilter !== "all") serverFilters["rating.eq"] = ratingFilter;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.reviews.lists({ page, status: statusFilter, rating: ratingFilter }),
    queryFn: () =>
      adminApi.getAllPaginated<ReviewWithDetails>("reviews", {
        select:
          "id, user_id, product_id, rating, comment, status, created_at, users(id, first_name, last_name, email), products(id, name)",
        order: "created_at.desc",
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        filters: serverFilters,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const reviews = data?.data ?? [];
  const totalCount = data?.totalCount ?? null;
  const totalPages = totalCount !== null ? Math.ceil(totalCount / PAGE_SIZE) : 1;

  // Client-side text search on the fetched page (joins prevent server-side search)
  const filteredReviews = reviews.filter((review) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      [review.users?.first_name, review.users?.last_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q) ||
      review.users?.email?.toLowerCase().includes(q) ||
      review.products?.name?.toLowerCase().includes(q) ||
      review.comment?.toLowerCase().includes(q)
    );
  });

  return {
    reviews,
    filteredReviews,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    ratingFilter,
    setRatingFilter,
    page,
    setPage,
    totalCount,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}
