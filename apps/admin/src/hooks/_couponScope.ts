"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { adminApi } from "@/lib/admin-api";

import type { Coupon } from "@/components/coupon/types";
import type { CouponScope } from "@/types/database";

interface RefItem {
  id: string;
  name: string;
}

export const SCOPE_TABLE_MAP: Record<string, string> = {
  product: "coupon_products",
  category: "coupon_categories",
  brand: "coupon_brands",
};

export const SCOPE_ID_FIELD_MAP: Record<string, string> = {
  product: "product_id",
  category: "category_id",
  brand: "brand_id",
};

export const SCOPE_REF_TABLE: Record<string, string> = {
  product: "products",
  category: "categories",
  brand: "brands",
};

const PRODUCTS_PAGE_SIZE = 50;

export function useScopeSearch(scope: CouponScope) {
  const [scopeSearch, setScopeSearch] = useState("");
  const [debouncedScopeSearch, setDebouncedScopeSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedScopeSearch(scopeSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [scopeSearch]);

  const refTable = SCOPE_REF_TABLE[scope] ?? null;
  const {
    data: scopeItemsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching: isFetchingScopeItems,
  } = useInfiniteQuery({
    queryKey: ["reference", "scope-items", scope, debouncedScopeSearch],
    queryFn: async ({ pageParam = 0 }) => {
      const options: Parameters<typeof adminApi.getAll>[1] = {
        select: "id,name",
        order: "name.asc",
        limit: PRODUCTS_PAGE_SIZE,
        offset: pageParam as number,
      };
      if (debouncedScopeSearch.trim()) {
        options!.filters = { search_words: debouncedScopeSearch.trim() };
      }
      return adminApi.getAll<RefItem>(refTable!, options);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PRODUCTS_PAGE_SIZE) return undefined;
      return allPages.reduce((total, page) => total + page.length, 0);
    },
    initialPageParam: 0,
    enabled: scope !== "all" && !!refTable,
    staleTime: 5 * 60 * 1000,
  });

  return {
    scopeSearch,
    setScopeSearch,
    scopeItems: scopeItemsData?.pages.flat() ?? [],
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchingScopeItems,
  };
}

export function useExistingScopeItems(id: string | undefined, coupon: Coupon | null) {
  return useQuery({
    queryKey: ["coupon-scope-items", id, coupon?.scope],
    queryFn: async () => {
      if (!coupon || coupon.scope === "all") return [] as RefItem[];
      const table = SCOPE_TABLE_MAP[coupon.scope];
      const idField = SCOPE_ID_FIELD_MAP[coupon.scope];
      const rt = SCOPE_REF_TABLE[coupon.scope];
      if (!table || !idField || !rt) return [] as RefItem[];

      const junctionData = await adminApi.getAll<Record<string, string>>(table, {
        filters: { "coupon_id.eq": id! },
      });
      const ids = junctionData.map((row) => row[idField]);
      if (ids.length === 0) return [] as RefItem[];

      return adminApi.getAll<RefItem>(rt, {
        select: "id,name",
        filters: { "id.in": ids.join(",") },
      });
    },
    enabled: !!id && !!coupon && coupon.scope !== "all",
  });
}

export async function saveScopeItems(couponId: string, scope: CouponScope, itemIds: string[]) {
  // Clear all junction tables for this coupon
  for (const table of Object.values(SCOPE_TABLE_MAP)) {
    await fetch(`/api/admin/${table}?coupon_id=${couponId}`, {
      method: "DELETE",
    });
  }

  // Insert new records if scope is not 'all'
  if (scope === "all" || itemIds.length === 0) return;

  const table = SCOPE_TABLE_MAP[scope];
  const idField = SCOPE_ID_FIELD_MAP[scope];
  if (!table || !idField) return;

  for (const itemId of itemIds) {
    await adminApi.insert(table, {
      coupon_id: couponId,
      [idField]: itemId,
    });
  }
}
