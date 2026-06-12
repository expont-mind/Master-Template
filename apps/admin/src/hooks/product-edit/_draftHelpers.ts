"use client";

import { type DraftData, type ProductDetail } from "./_draft";
import { createEmptyVariant } from "./_helpers";
import { type FormSetters } from "./_useProductDataSync";

import type { GeneratedVariant, OptionGroup, VariantForm } from "@/components/product/types";
import type { ProductStatus } from "@/types/database";

export type DraftSnapshot = {
  name: string;
  slug: string;
  description: string;
  status: ProductStatus;
  brandId: string | null;
  originalUrl: string;
  images: string[];
  categoryIds: string[];
  variants: VariantForm[];
  productDetails: ProductDetail[];
  richDescription: string;
  richImages: string[];
  optionGroups: OptionGroup[];
  generatedVariants: GeneratedVariant[];
};

export function buildDraftSnapshot(state: FormSetters & DraftSnapshot): DraftSnapshot {
  return {
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
  };
}

export function restoreDraftIntoForm(draft: DraftData, setters: FormSetters): void {
  setters.setName(draft.name);
  setters.setSlug(draft.slug);
  setters.setDescription(draft.description);
  setters.setStatus(draft.status as ProductStatus);
  setters.setBrandId(draft.brandId);
  setters.setOriginalUrl(draft.originalUrl || "");
  setters.setImages(draft.images);
  setters.setCategoryIds(draft.categoryIds);
  setters.setVariants(draft.variants.length > 0 ? draft.variants : [createEmptyVariant()]);
  setters.setProductDetails(draft.productDetails);
  setters.setRichDescription(draft.richDescription || "");
  setters.setRichImages(draft.richImages || []);
  setters.setOptionGroups(draft.optionGroups || []);
  setters.setGeneratedVariants(draft.generatedVariants || []);
}
