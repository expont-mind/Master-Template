"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { Coupon, CouponFormData } from "@/components/coupon/types";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";
import type { CouponScope } from "@/types/database";

function randomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const defaultFormData: CouponFormData = {
  code: "",
  type: "percentage",
  scope: "all",
  discount_value: 0,
  min_purchase_amount: null,
  max_discount_amount: null,
  usage_limit: null,
  usage_limit_per_user: null,
  max_applicable_qty: null,
  start_date: null,
  end_date: null,
  is_active: true,
};

interface DeliveryZoneRow {
  delivery_fee: number;
  name: string;
}

interface RefItem {
  id: string;
  name: string;
}

const SCOPE_TABLE_MAP: Record<string, string> = {
  product: "coupon_products",
  category: "coupon_categories",
  brand: "coupon_brands",
};

const SCOPE_ID_FIELD_MAP: Record<string, string> = {
  product: "product_id",
  category: "category_id",
  brand: "brand_id",
};

const PRODUCTS_PAGE_SIZE = 50;

function generateCouponName(type: string, value: number): string {
  if (type === "percentage") return `${value}% -н купон`;
  if (type === "fixed") return `${value.toLocaleString()}₮ -н купон`;
  return "Үнэгүй хүргэлт купон";
}

const SCOPE_REF_TABLE: Record<string, string> = {
  product: "products",
  category: "categories",
  brand: "brands",
};

export function useCouponEdit(id?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CouponFormData>(() => ({
    ...defaultFormData,
    code: id ? "" : randomCode(),
  }));
  const [scopeItemIds, setScopeItemIds] = useState<string[]>([]);
  const [scopeItemNames, setScopeItemNames] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scopeSearch, setScopeSearch] = useState("");
  const [debouncedScopeSearch, setDebouncedScopeSearch] = useState("");

  const isEditMode = !!id;

  const { data: coupon = null, isLoading } = useQuery({
    queryKey: queryKeys.coupons.detail(id!),
    queryFn: () => adminApi.getById<Coupon>("coupons", id!),
    enabled: isEditMode,
  });

  // Fetch delivery fee for free_shipping auto-fill
  const { data: deliveryZones = [] } = useQuery({
    queryKey: ["delivery_zones_fee"],
    queryFn: () =>
      adminApi.getAll<DeliveryZoneRow>("delivery_zones", {
        select: "name,delivery_fee",
        filters: { "is_active.eq": "true" },
      }),
  });
  const deliveryFee =
    deliveryZones.find((z) => z.name === "Улаанбаатар")?.delivery_fee ?? 0;

  // Debounce scope search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedScopeSearch(scopeSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [scopeSearch]);

  // Unified infinite query for all scope types (product/category/brand)
  const refTable = SCOPE_REF_TABLE[formData.scope] ?? null;
  const {
    data: scopeItemsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching: isFetchingScopeItems,
  } = useInfiniteQuery({
    queryKey: ["reference", "scope-items", formData.scope, debouncedScopeSearch],
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
    enabled: formData.scope !== "all" && !!refTable,
    staleTime: 5 * 60 * 1000,
  });
  const scopeItems = scopeItemsData?.pages.flat() ?? [];

  // Fetch existing scope items with names when editing
  const { data: existingScopeItems = [] } = useQuery({
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

      const refData = await adminApi.getAll<RefItem>(rt, {
        select: "id,name",
        filters: { "id.in": ids.join(",") },
      });
      return refData;
    },
    enabled: isEditMode && !!coupon && coupon.scope !== "all",
  });

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code,
        type: coupon.type,
        scope: coupon.scope,
        discount_value: coupon.discount_value,
        min_purchase_amount: coupon.min_purchase_amount,
        max_discount_amount: coupon.max_discount_amount,
        usage_limit: coupon.usage_limit,
        usage_limit_per_user: coupon.usage_limit_per_user,
        max_applicable_qty: coupon.max_applicable_qty,
        start_date: coupon.start_date,
        end_date: coupon.end_date,
        is_active: coupon.is_active,
      });
    }
  }, [coupon]);

  useEffect(() => {
    if (existingScopeItems.length > 0) {
      setScopeItemIds(existingScopeItems.map((i) => i.id));
      setScopeItemNames(
        Object.fromEntries(existingScopeItems.map((i) => [i.id, i.name])),
      );
    }
  }, [existingScopeItems]);

  const updateFormData = (updates: Partial<CouponFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const generateCode = () => {
    updateFormData({ code: randomCode() });
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      setError("Купоны кодыг заавал оруулна уу.");
      return;
    }
    if (formData.discount_value <= 0) {
      setError("Хөнгөлөлтийн утгыг зөв оруулна уу. (0-ээс их байх ёстой)");
      return;
    }
    if (formData.scope !== "all" && scopeItemIds.length === 0) {
      setError("Хамрах хүрээний зүйл сонгоно уу");
      return;
    }

    setIsSaving(true);
    setError(null);

    const name = generateCouponName(formData.type, formData.discount_value);

    try {
      let couponId: string;

      if (isEditMode && id) {
        const result = await adminApi.update("coupons", id, {
          ...formData,
          name,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>);
        couponId = (result as { id: string }).id ?? id;
      } else {
        const result = await adminApi.insert("coupons", {
          ...formData,
          name,
          usage_count: 0,
        } as Record<string, unknown>);
        couponId = (result as { id: string }).id;
      }

      // Save scope junction records
      await saveScopeItems(couponId, formData.scope, scopeItemIds);

      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
      router.push("/coupons");
    } catch (err) {
      setError(translateServerError(err instanceof Error ? err.message : "", "Купон хадгалахад алдаа гарлаа."));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    coupon,
    formData,
    isLoading,
    isSaving,
    error,
    isEditMode,
    deliveryFee,
    scopeItemIds,
    setScopeItemIds,
    scopeItemNames,
    setScopeItemNames,
    scopeItems,
    scopeSearch,
    setScopeSearch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchingScopeItems,
    updateFormData,
    generateCode,
    handleSave,
  };
}

async function saveScopeItems(
  couponId: string,
  scope: CouponScope,
  itemIds: string[],
) {
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
