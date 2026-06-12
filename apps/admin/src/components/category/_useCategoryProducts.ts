"use client";

import { useQuery } from "@tanstack/react-query";

import { adminApi } from "@/lib/admin-api";

import type { CategoryProductRow } from "./_CategoryProductsTable";

interface UseCategoryProductsArgs {
  open: boolean;
  categoryId: string;
  page: number;
  pageSize: number;
  search: string;
}

export function useCategoryProducts({
  open,
  categoryId,
  page,
  pageSize,
  search,
}: UseCategoryProductsArgs) {
  return useQuery({
    queryKey: ["category-products", categoryId, page, pageSize, search],
    queryFn: async () => {
      const result = await adminApi.getAllPaginated<{
        products: CategoryProductRow;
      }>("product_categories", {
        select: "products(id,name,price,discount_price,product_images(url))",
        order: "products(name).asc",
        limit: pageSize,
        offset: (page - 1) * pageSize,
        filters: {
          "category_id.eq": categoryId,
        },
      });
      return {
        data: result.data.map((row) => row.products).filter(Boolean),
        totalCount: result.totalCount,
      };
    },
    enabled: open && !!categoryId,
  });
}
