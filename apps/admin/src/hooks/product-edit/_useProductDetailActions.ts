import { useCallback } from "react";

import type { ProductDetail } from "./_draft";
import type { VariantForm } from "@/components/product/types";

export function useProductDetailActions(
  setProductDetails: React.Dispatch<React.SetStateAction<ProductDetail[]>>,
) {
  const addProductDetail = useCallback(() => {
    setProductDetails((prev) => [...prev, { id: crypto.randomUUID(), type: "", content: "" }]);
  }, [setProductDetails]);

  const removeProductDetail = useCallback(
    (detailId: string) => {
      setProductDetails((prev) => prev.filter((d) => d.id !== detailId));
    },
    [setProductDetails],
  );

  const updateProductDetail = useCallback(
    (detailId: string, field: "type" | "content", value: string) => {
      setProductDetails((prev) =>
        prev.map((d) => (d.id === detailId ? { ...d, [field]: value } : d)),
      );
    },
    [setProductDetails],
  );

  const reorderProductDetails = useCallback(
    (fromIndex: number, toIndex: number) => {
      setProductDetails((prev) => {
        const updated = [...prev];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        return updated;
      });
    },
    [setProductDetails],
  );

  return {
    addProductDetail,
    removeProductDetail,
    updateProductDetail,
    reorderProductDetails,
  };
}

export function useAttributeToggle(
  selectedAttributes: string[],
  setSelectedAttributes: React.Dispatch<React.SetStateAction<string[]>>,
  setVariants: React.Dispatch<React.SetStateAction<VariantForm[]>>,
) {
  return useCallback(
    (attributeId: string) => {
      if (selectedAttributes.includes(attributeId)) {
        setSelectedAttributes((prev) => prev.filter((a) => a !== attributeId));
        setVariants((prev) =>
          prev.map((v) => {
            const newAttrs = { ...v.attributes };
            delete newAttrs[attributeId];
            return { ...v, attributes: newAttrs };
          }),
        );
      } else {
        setSelectedAttributes((prev) => [...prev, attributeId]);
      }
    },
    [selectedAttributes, setSelectedAttributes, setVariants],
  );
}
