"use client";

import { useQuery } from "@tanstack/react-query";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

export function useProductListLookups() {
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () =>
      adminApi.getAll<{ id: string; name: string; parent_id: string | null }>("categories", {
        select: "id, name, parent_id",
        order: "name.asc",
      }),
    staleTime: 5 * 60_000,
  });

  const { data: brands = [] } = useQuery({
    queryKey: queryKeys.brands.all,
    queryFn: () =>
      adminApi.getAll<{ id: string; name: string }>("brands", {
        select: "id, name",
        order: "name.asc",
      }),
    staleTime: 5 * 60_000,
  });

  return { categories, brands };
}
