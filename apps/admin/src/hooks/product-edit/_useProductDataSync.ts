"use client";

import { useEffect } from "react";

import {
  buildGeneratedVariants,
  getCategoryIds,
  getOptionGroupsFromMetadata,
  getProductImages,
} from "./_buildFromData";
import { type ProductDetail } from "./_draft";
import { createEmptyVariant, generateSku } from "./_helpers";

import type {
  GeneratedVariant,
  OptionGroup,
  Product,
  VariantForm,
} from "@/components/product/types";
import type { ProductStatus } from "@/types/database";

export type FormSetters = {
  setName: (v: string) => void;
  setSlug: (v: string) => void;
  setDescription: (v: string) => void;
  setStatus: (v: ProductStatus) => void;
  setBrandId: (v: string | null) => void;
  setOriginalUrl: (v: string) => void;
  setImages: (v: string[]) => void;
  setCategoryIds: (v: string[]) => void;
  setVariants: (v: VariantForm[]) => void;
  setProductDetails: (v: ProductDetail[]) => void;
  setRichDescription: (v: string) => void;
  setRichImages: (v: string[]) => void;
  setOptionGroups: (v: OptionGroup[]) => void;
  setGeneratedVariants: (v: GeneratedVariant[]) => void;
};

type Bundle = {
  product: Product;
  productDetailsData: ProductDetail[];
  richDesc: string;
  richImgs: string[];
};

function applyCommonFields(data: Product, setters: FormSetters) {
  setters.setDescription(data.description || "");
  setters.setStatus(data.status);
  setters.setBrandId(data.brand_id);
  setters.setOriginalUrl(data.original_url || "");
  setters.setImages(getProductImages(data));
  setters.setCategoryIds(getCategoryIds(data));
}

function applySingleVariant(data: Product, isDuplicate: boolean, setters: FormSetters) {
  setters.setVariants([
    {
      id: crypto.randomUUID(),
      sku: isDuplicate ? generateSku() : "",
      name: "",
      price: data.price?.toString() || "",
      discountPrice: data.discount_price?.toString() || "",
      stockQuantity: data.stock_quantity?.toString() || "0",
      attributes: {},
      images: [],
      details: [],
    },
  ]);
}

function applyOptionGroupsAndVariants(data: Product, freshIds: boolean, setters: FormSetters) {
  const optionGroups = getOptionGroupsFromMetadata(data);
  if (optionGroups.length === 0) return;
  setters.setOptionGroups(optionGroups);
  const variants = buildGeneratedVariants(data, { freshIds });
  if (variants.length > 0) {
    setters.setGeneratedVariants(variants);
  }
}

function applyProductBundle(bundle: Bundle, setters: FormSetters) {
  const { product: data, productDetailsData } = bundle;

  setters.setName(data.name);
  setters.setSlug(data.slug || "");
  applyCommonFields(data, setters);
  applySingleVariant(data, false, setters);
  setters.setProductDetails(productDetailsData);
  setters.setRichDescription(bundle.richDesc ?? "");
  setters.setRichImages(Array.isArray(bundle.richImgs) ? bundle.richImgs : []);
  applyOptionGroupsAndVariants(data, false, setters);
}

function applyDuplicateBundle(bundle: Bundle, setters: FormSetters) {
  const { product: data, productDetailsData } = bundle;

  setters.setName(`${data.name} (хуулбар)`);
  const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const baseSlug = data.slug?.replace(/-copy-[a-z0-9]+$/, "") || "";
  setters.setSlug(baseSlug ? `${baseSlug}-copy-${suffix}` : `product-copy-${suffix}`);
  applyCommonFields(data, setters);
  applySingleVariant(data, true, setters);
  setters.setProductDetails(productDetailsData.map((d) => ({ ...d, id: crypto.randomUUID() })));
  setters.setRichDescription(bundle.richDesc ?? "");
  setters.setRichImages(Array.isArray(bundle.richImgs) ? bundle.richImgs : []);
  applyOptionGroupsAndVariants(data, true, setters);
}

export function useProductDataSync(
  productData: Bundle | undefined,
  duplicateData: Bundle | undefined,
  setters: FormSetters,
) {
  useEffect(() => {
    if (!productData) return;
    applyProductBundle(productData, setters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productData]);

  useEffect(() => {
    if (!duplicateData) return;
    applyDuplicateBundle(duplicateData, setters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duplicateData]);
}

// Stable initial variant for first render.
export const initialVariants = (): VariantForm[] => [createEmptyVariant()];
