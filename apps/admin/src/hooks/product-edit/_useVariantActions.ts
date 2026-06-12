import { useCallback } from "react";

import { createEmptyVariant } from "./_helpers";

import type { VariantForm, VariantDetail } from "@/components/product/types";

export function useVariantActions(
  setVariants: React.Dispatch<React.SetStateAction<VariantForm[]>>,
) {
  const addVariant = useCallback(() => {
    setVariants((prev) => [...prev, createEmptyVariant()]);
  }, [setVariants]);

  const removeVariant = useCallback(
    (variantId: string) => {
      setVariants((prev) => (prev.length > 1 ? prev.filter((v) => v.id !== variantId) : prev));
    },
    [setVariants],
  );

  const updateVariant = useCallback(
    (variantId: string, field: keyof VariantForm, value: string | { [key: string]: string }) => {
      setVariants((prev) => prev.map((v) => (v.id === variantId ? { ...v, [field]: value } : v)));
    },
    [setVariants],
  );

  const updateVariantAttribute = useCallback(
    (variantId: string, attributeId: string, valueId: string) => {
      setVariants((prev) =>
        prev.map((v) =>
          v.id === variantId
            ? { ...v, attributes: { ...v.attributes, [attributeId]: valueId } }
            : v,
        ),
      );
    },
    [setVariants],
  );

  const updateVariantImages = useCallback(
    (variantId: string, newImages: string[]) => {
      setVariants((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, images: newImages } : v)),
      );
    },
    [setVariants],
  );

  const addVariantDetail = useCallback(
    (variantId: string) => {
      setVariants((prev) =>
        prev.map((v) =>
          v.id === variantId
            ? {
                ...v,
                details: [
                  ...v.details,
                  {
                    id: crypto.randomUUID(),
                    type: "" as VariantDetail["type"],
                    content: "",
                  },
                ],
              }
            : v,
        ),
      );
    },
    [setVariants],
  );

  const removeVariantDetail = useCallback(
    (variantId: string, detailId: string) => {
      setVariants((prev) =>
        prev.map((v) =>
          v.id === variantId ? { ...v, details: v.details.filter((d) => d.id !== detailId) } : v,
        ),
      );
    },
    [setVariants],
  );

  const updateVariantDetail = useCallback(
    (variantId: string, detailId: string, field: "type" | "content", value: string) => {
      setVariants((prev) =>
        prev.map((v) =>
          v.id === variantId
            ? {
                ...v,
                details: v.details.map((d) => (d.id === detailId ? { ...d, [field]: value } : d)),
              }
            : v,
        ),
      );
    },
    [setVariants],
  );

  return {
    addVariant,
    removeVariant,
    updateVariant,
    updateVariantAttribute,
    updateVariantImages,
    addVariantDetail,
    removeVariantDetail,
    updateVariantDetail,
  };
}
