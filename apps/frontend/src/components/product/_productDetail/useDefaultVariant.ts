"use client";

import { useEffect, useMemo, useState } from "react";

import type { ProductWithDetails } from "@/lib/queries/products";

/**
 * Resolve the variant id we should display by default when the user
 * has not picked anything yet. Prefers in-stock variants and, when the
 * product has option groups, the smallest variant whose option count
 * matches the number of required groups (i.e. the "base" combo).
 *
 * Also tracks `variantsReady`: the first paint must show a skeleton
 * for variants until the client fetch has run, otherwise a stale
 * cached row may select an out-of-stock variant on hard refresh.
 */
export function useDefaultVariant(
  product: ProductWithDetails | null | undefined,
  isFetching: boolean,
) {
  const defaultVariantId = useMemo(() => {
    if (!product?.variants?.length) return undefined;
    const optionGroups = product.option_groups;
    const requiredCount = optionGroups?.filter((g) => g.is_required !== false).length ?? 0;

    const inStock = product.variants.filter((v) => v.stock_quantity > 0);
    const pool = inStock.length > 0 ? inStock : product.variants;

    const baseVariant =
      requiredCount > 0
        ? pool.find((v) => v.option_values && v.option_values.length === requiredCount)
        : undefined;
    return (baseVariant || pool.find((v) => v.is_default) || pool[0])?.id;
  }, [product]);

  const [variantsReady, setVariantsReady] = useState(false);
  useEffect(() => {
    if (!isFetching && product?.variants?.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVariantsReady(true);
    }
  }, [isFetching, product]);

  return { defaultVariantId, variantsReady };
}
