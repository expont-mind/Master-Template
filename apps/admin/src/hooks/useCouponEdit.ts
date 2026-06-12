"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Coupon, CouponFormData } from "@/components/coupon/types";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { DELIVERY_ZONES_CONFIG } from "@/lib/utils/brand-config";
import { translateServerError } from "@/lib/utils/error-messages";

import { persistCoupon, randomCouponCode, validateCouponForm } from "./_couponSave";
import { useExistingScopeItems, useScopeSearch } from "./_couponScope";

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

export function useCouponEdit(id?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CouponFormData>(() => ({
    ...defaultFormData,
    code: id ? "" : randomCouponCode(),
  }));
  const [scopeItemIds, setScopeItemIds] = useState<string[]>([]);
  const [scopeItemNames, setScopeItemNames] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    deliveryZones.find((z) => z.name === DELIVERY_ZONES_CONFIG.capital)?.delivery_fee ?? 0;

  const {
    scopeSearch,
    setScopeSearch,
    scopeItems,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchingScopeItems,
  } = useScopeSearch(formData.scope);

  const { data: existingScopeItems = [] } = useExistingScopeItems(id, coupon);

  useEffect(() => {
    if (coupon) {
      // Intentional one-time form prefill from Supabase fetch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      // Intentional one-time prefill of scope selection from Supabase fetch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScopeItemIds(existingScopeItems.map((i) => i.id));
      setScopeItemNames(Object.fromEntries(existingScopeItems.map((i) => [i.id, i.name])));
    }
  }, [existingScopeItems]);

  const updateFormData = (updates: Partial<CouponFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const generateCode = () => {
    updateFormData({ code: randomCouponCode() });
  };

  const handleSave = async () => {
    const validationError = validateCouponForm(formData, scopeItemIds);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await persistCoupon(id, formData, scopeItemIds);
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
      router.push("/coupons");
    } catch (err) {
      setError(
        translateServerError(
          err instanceof Error ? err.message : "",
          "Купон хадгалахад алдаа гарлаа.",
        ),
      );
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
