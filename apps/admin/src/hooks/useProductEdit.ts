"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

import { buildSavePayload } from "./product-edit/_buildSavePayload";
import { clearDraft, type ProductDetail } from "./product-edit/_draft";
import { buildDraftSnapshot, restoreDraftIntoForm } from "./product-edit/_draftHelpers";
import { initialVariants, useProductDataSync } from "./product-edit/_useProductDataSync";
import {
  useAttributeToggle,
  useProductDetailActions,
} from "./product-edit/_useProductDetailActions";
import { useDuplicateProductQuery, useProductDetailQuery } from "./product-edit/_useProductQueries";
import { useVariantActions } from "./product-edit/_useVariantActions";
import { generateSlug, validateProductForm } from "./product-edit/_validation";
import { useProductDraft } from "./product-edit/useProductDraft";
import { useProductReferenceData } from "./product-edit/useProductReferenceData";

import type { GeneratedVariant, OptionGroup, VariantForm } from "@/components/product/types";
import type { ProductStatus } from "@/types/database";

// Re-export so existing consumers (ProductForm, ProductMainCard) can
// keep importing ProductDetail from `@/hooks/useProductEdit`.
export type { ProductDetail };

function useProductFormState() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProductStatus>("active");
  const [brandId, setBrandId] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantForm[]>(initialVariants);
  const [productDetails, setProductDetails] = useState<ProductDetail[]>([]);
  const [richDescription, setRichDescription] = useState("");
  const [richImages, setRichImages] = useState<string[]>([]);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);

  return {
    name,
    setName,
    slug,
    setSlug,
    description,
    setDescription,
    status,
    setStatus,
    brandId,
    setBrandId,
    originalUrl,
    setOriginalUrl,
    images,
    setImages,
    categoryIds,
    setCategoryIds,
    variants,
    setVariants,
    productDetails,
    setProductDetails,
    richDescription,
    setRichDescription,
    richImages,
    setRichImages,
    optionGroups,
    setOptionGroups,
    generatedVariants,
    setGeneratedVariants,
    selectedAttributes,
    setSelectedAttributes,
  };
}

type FormStateBundle = ReturnType<typeof useProductFormState>;

function useSaveProductMutation(id: string, isNew: boolean, state: FormStateBundle) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const payload = buildSavePayload({
        id,
        isNew,
        name: state.name,
        slug: state.slug,
        description: state.description,
        status: state.status,
        brandId: state.brandId,
        originalUrl: state.originalUrl,
        images: state.images,
        categoryIds: state.categoryIds,
        variants: state.variants,
        productDetails: state.productDetails,
        richDescription: state.richDescription,
        richImages: state.richImages,
        optionGroups: state.optionGroups,
        generatedVariants: state.generatedVariants,
        slugFallback: () => generateSlug(state.name),
      });
      await adminApi.rpc<string>("save_product", payload);
    },
    onSuccess: () => {
      clearDraft();
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      router.push("/products");
    },
  });
}

export function useProductEdit(id: string, duplicateId?: string) {
  const isNew = id === "new";

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false); // Давхар хадгалахаас хамгаалах

  const state = useProductFormState();
  const variantActions = useVariantActions(state.setVariants);
  const detailActions = useProductDetailActions(state.setProductDetails);
  const toggleAttribute = useAttributeToggle(
    state.selectedAttributes,
    state.setSelectedAttributes,
    state.setVariants,
  );

  useProductDraft({
    enabled: isNew,
    current: buildDraftSnapshot(state),
    onRestore: (draft) => restoreDraftIntoForm(draft, state),
  });

  const {
    brands,
    categories,
    availableAttributes,
    isLoading: isLoadingData,
  } = useProductReferenceData();

  const { data: productData, isLoading: isLoadingProduct } = useProductDetailQuery(id, isNew);
  const { data: duplicateData } = useDuplicateProductQuery(duplicateId, isNew);

  useProductDataSync(productData, duplicateData, state);

  const product = productData?.product ?? null;
  const saveMutation = useSaveProductMutation(id, isNew, state);

  const handleSave = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setError(null);

    const validationError = validateProductForm({
      name: state.name,
      images: state.images,
      variants: state.variants,
      optionGroups: state.optionGroups,
      generatedVariants: state.generatedVariants,
      originalUrl: state.originalUrl,
    });
    if (validationError) {
      setError(validationError);
      savingRef.current = false;
      return;
    }

    setIsSaving(true);
    try {
      await saveMutation.mutateAsync();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(translateServerError(msg));
    } finally {
      setIsSaving(false);
      savingRef.current = false;
    }
  };

  return {
    product,
    isNew,
    isLoading: (isNew ? false : isLoadingProduct) || isLoadingData,
    isSaving,
    error,
    name: state.name,
    setName: state.setName,
    slug: state.slug,
    setSlug: state.setSlug,
    description: state.description,
    setDescription: state.setDescription,
    status: state.status,
    setStatus: state.setStatus,
    brandId: state.brandId,
    setBrandId: state.setBrandId,
    originalUrl: state.originalUrl,
    setOriginalUrl: state.setOriginalUrl,
    images: state.images,
    setImages: state.setImages,
    categoryIds: state.categoryIds,
    setCategoryIds: state.setCategoryIds,
    brands,
    categories,
    variants: state.variants,
    ...variantActions,
    productDetails: state.productDetails,
    ...detailActions,
    selectedAttributes: state.selectedAttributes,
    toggleAttribute,
    availableAttributes,
    generateSlug,
    handleSave,
    richDescription: state.richDescription,
    setRichDescription: state.setRichDescription,
    richImages: state.richImages,
    setRichImages: state.setRichImages,
    optionGroups: state.optionGroups,
    setOptionGroups: state.setOptionGroups,
    generatedVariants: state.generatedVariants,
    setGeneratedVariants: state.setGeneratedVariants,
  };
}
