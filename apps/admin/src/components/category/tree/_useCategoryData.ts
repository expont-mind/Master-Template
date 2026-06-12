"use client";

import { useCallback, useEffect, useState } from "react";

import { adminApi } from "@/lib/admin-api";
import { log } from "@/lib/observability/log";

import type { Category } from "@/components/category/types";

export function useCategoryData() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await adminApi.getAll<Category>("categories", {
        select: "id, name, slug, parent_id, image, is_featured, is_active, sort_order",
        order: "sort_order.asc",
      });
      setCategories(data);
    } catch (error) {
      log.error("categories_fetch_failed", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, [fetchCategories]);

  return { categories, setCategories, isLoading, fetchCategories };
}
