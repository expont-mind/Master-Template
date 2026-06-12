// Shared reference data for the product edit form: brands, categories, and
// available product attributes (color, size, etc.).
//
// Pulled out of useProductEdit so:
//   - The product edit page isn't the only consumer (variant builder, bulk
//     edit, and any other surface that needs the same dropdowns can reuse it).
//   - Stale-time is centralized — bumping it from 10min to 1hr is one edit.
//   - Tests for the form can mock this hook directly instead of stubbing fetch.

import { useQuery } from "@tanstack/react-query";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import type { Attribute, Brand, Category } from "@/components/product/types";

interface AttributeFromDB {
  id: string;
  name: string;
  display_name: string;
  product_attribute_values: {
    id: string;
    value: string;
    display_value: string;
    color_hex: string | null;
  }[];
}

export interface ProductReferenceData {
  brands: Brand[];
  categories: Category[];
  availableAttributes: Attribute[];
}

export function useProductReferenceData() {
  const { data, isLoading } = useQuery<ProductReferenceData>({
    queryKey: [...queryKeys.reference.all, "product-edit"],
    queryFn: async () => {
      const [brandsData, categoriesData, attributesData] = await Promise.all([
        adminApi.getAll<Brand>("brands"),
        adminApi.getAll<Category>("categories"),
        adminApi.getAll<AttributeFromDB>("product_attributes", {
          select:
            "id, name, display_name, product_attribute_values(id, value, display_value, color_hex)",
        }),
      ]);

      const availableAttributes: Attribute[] = attributesData.map((attr) => ({
        id: attr.id,
        name: attr.name,
        display_name: attr.display_name,
        values: attr.product_attribute_values || [],
      }));

      return {
        brands: brandsData,
        categories: categoriesData,
        availableAttributes,
      };
    },
    // 10min — brands/categories/attributes change rarely; shared cache key
    // means every product edit page hits a warm cache after the first load.
    staleTime: 10 * 60 * 1000,
  });

  return {
    brands: data?.brands ?? [],
    categories: data?.categories ?? [],
    availableAttributes: data?.availableAttributes ?? [],
    isLoading,
  };
}
