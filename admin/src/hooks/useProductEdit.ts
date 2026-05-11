"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import type { Product, ProductVariant, VariantForm, VariantDetail, Attribute, Brand, Category, OptionGroup, GeneratedVariant } from "@/components/product/types";
import { translateServerError } from "@/lib/utils/error-messages";

export interface ProductDetail {
  id: string;
  type: string;
  content: string;
}

import type { ProductStatus } from "@/types/database";
import { queryKeys } from "@/lib/query-keys";

// Build all variant combinations: base (required) + extended (required + optional subsets)
function buildAllVariantCombinations(
  optionGroups: Array<{ type: string; values: string[]; is_required?: boolean }>,
): string[][] {
  const requiredGroups = optionGroups.filter(
    (g) => g.values.length > 0 && g.is_required !== false,
  );
  const optionalGroups = optionGroups.filter(
    (g) => g.values.length > 0 && g.is_required === false,
  );
  if (requiredGroups.length === 0) return [];

  const baseCombinations: string[][] = requiredGroups.reduce<string[][]>(
    (acc, group) => {
      if (acc.length === 0) return group.values.map((v) => [v]);
      return acc.flatMap((combo) => group.values.map((v) => [...combo, v]));
    },
    [],
  );

  const allCombinations: string[][] = [...baseCombinations];

  if (optionalGroups.length > 0) {
    for (let i = 1; i < 1 << optionalGroups.length; i++) {
      const subset: typeof optionalGroups = [];
      for (let j = 0; j < optionalGroups.length; j++) {
        if (i & (1 << j)) subset.push(optionalGroups[j]);
      }
      const optCombinations = subset.reduce<string[][]>(
        (acc, group) => {
          if (acc.length === 0) return group.values.map((v) => [v]);
          return acc.flatMap((combo) => group.values.map((v) => [...combo, v]));
        },
        [],
      );
      for (const base of baseCombinations) {
        for (const opt of optCombinations) {
          allCombinations.push([...base, ...opt]);
        }
      }
    }
  }

  return allCombinations;
}

const generateSku = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SKU-${timestamp}${random}`;
};

const createEmptyVariant = (): VariantForm => ({
  id: crypto.randomUUID(),
  sku: generateSku(),
  name: "",
  price: "",
  discountPrice: "",
  stockQuantity: "",
  attributes: {},
  images: [],
  details: [],
});

const DRAFT_KEY = "product_draft";

interface DraftData {
  name: string;
  slug: string;
  description: string;
  status: string;
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
  savedAt: number;
}

// Size cap: a typical product form serialises to ~5–20 KB. Anything
// bigger likely means a pasted base64 image or runaway state; drop it
// rather than blow past a shared-computer user's quota.
const DRAFT_MAX_BYTES = 50 * 1024;
// Drafts older than this are dropped on hydrate. Tightened from 24 h —
// shared admin workstations shouldn't hand stale drafts between shifts.
const DRAFT_MAX_AGE_MS = 60 * 60 * 1000;

const saveDraft = (data: Omit<DraftData, "savedAt">) => {
  try {
    const payload = JSON.stringify({ ...data, savedAt: Date.now() });
    if (payload.length > DRAFT_MAX_BYTES) {
      // Refuse to persist oversized drafts — usually means an image was
      // pasted as base64 instead of uploaded.
      return;
    }
    localStorage.setItem(DRAFT_KEY, payload);
  } catch {
    // localStorage full or unavailable
  }
};

const loadDraft = (): DraftData | null => {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return null;
    if (saved.length > DRAFT_MAX_BYTES) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    const data = JSON.parse(saved) as DraftData;
    if (Date.now() - data.savedAt > DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
};

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

export function useProductEdit(id: string, duplicateId?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false); // Давхар хадгалахаас хамгаалах

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProductStatus>("active");
  const [brandId, setBrandId] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  // Variants
  const [variants, setVariants] = useState<VariantForm[]>([createEmptyVariant()]);

  // Product-level details (Дэлгэрэнгүй тайлбар)
  const [productDetails, setProductDetails] = useState<ProductDetail[]>([]);

  // Rich description (Дэлгэрэнгүй тайлбар текст + зураг)
  const [richDescription, setRichDescription] = useState("");
  const [richImages, setRichImages] = useState<string[]>([]);

  // Option groups for multi-option products
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);

  // Selected attributes for this product
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Load draft on mount (only for new products)
  useEffect(() => {
    if (!isNew || draftLoaded) return;
    const draft = loadDraft();
    if (draft) {
      setName(draft.name);
      setSlug(draft.slug);
      setDescription(draft.description);
      setStatus(draft.status as ProductStatus);
      setBrandId(draft.brandId);
      setOriginalUrl(draft.originalUrl || "");
      setImages(draft.images);
      setCategoryIds(draft.categoryIds);
      setVariants(draft.variants.length > 0 ? draft.variants : [createEmptyVariant()]);
      setProductDetails(draft.productDetails);
      setRichDescription(draft.richDescription || "");
      setRichImages(draft.richImages || []);
      setOptionGroups(draft.optionGroups || []);
      setGeneratedVariants(draft.generatedVariants || []);
    }
    setDraftLoaded(true);
  }, [isNew, draftLoaded]);

  // Auto-save draft when form changes (only for new products)
  useEffect(() => {
    if (!isNew || !draftLoaded) return;
    // Don't save empty drafts
    if (!name && !description && images.length === 0 && productDetails.length === 0) return;

    saveDraft({
      name,
      slug,
      description,
      status,
      brandId,
      originalUrl,
      images,
      categoryIds,
      variants,
      productDetails,
      richDescription,
      richImages,
      optionGroups,
      generatedVariants,
    });
  }, [isNew, draftLoaded, name, slug, description, status, brandId, originalUrl, images, categoryIds, variants, productDetails, richDescription, richImages, optionGroups, generatedVariants]);

  // Reference data query (brands, categories, attributes) — shared with longer staleTime
  const { data: referenceData, isLoading: isLoadingData } = useQuery({
    queryKey: [...queryKeys.reference.all, "product-edit"],
    queryFn: async () => {
      const [brandsData, categoriesData, attributesData] = await Promise.all([
        adminApi.getAll<Brand>("brands"),
        adminApi.getAll<Category>("categories"),
        adminApi.getAll<AttributeFromDB>("product_attributes", {
          select: "id, name, display_name, product_attribute_values(id, value, display_value, color_hex)",
        }),
      ]);

      const transformedAttributes: Attribute[] = attributesData.map((attr) => ({
        id: attr.id,
        name: attr.name,
        display_name: attr.display_name,
        values: attr.product_attribute_values || [],
      }));

      return {
        brands: brandsData,
        categories: categoriesData,
        availableAttributes: transformedAttributes,
      };
    },
    staleTime: 10 * 60 * 1000, // 10min — shared reference data
  });

  const brands = referenceData?.brands ?? [];
  const categories = referenceData?.categories ?? [];
  const availableAttributes = referenceData?.availableAttributes ?? [];

  // Product data query — only when editing
  const { data: productData, isLoading: isLoadingProduct } = useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: async () => {
      const data = await adminApi.getById<Product>("products", id, {
        select: `
          id,
          name,
          slug,
          description,
          price,
          discount_price,
          stock_quantity,
          status,
          brand_id,
          original_url,
          metadata,
          created_at,
          updated_at,
          brands (id, name),
          product_variants (id, sku, name, price, discount_price, stock_quantity, status),
          product_images (id, url, alt_text, is_primary, sort_order, variant_id),
          product_categories (category_id)
        `,
      });

      // Fetch product details (at product level)
      let productDetailsData: ProductDetail[] = [];
      try {
        const details = await adminApi.getAll<{ id: string; type: string; content: string; sort_order: number }>(
          "product_details",
          {
            filters: { "product_id.eq": data.id },
            order: "sort_order.asc",
          }
        );
        productDetailsData = details.map((d) => ({
          id: d.id,
          type: d.type,
          content: d.content,
        }));
      } catch {
        // Fallback: leave empty
      }

      // Fetch rich description from product_rich_descriptions table
      let richDesc = "";
      let richImgs: string[] = [];
      try {
        const richData = await adminApi.getAll<{ content: string | null; images: string[] | null }>(
          "product_rich_descriptions",
          { filters: { "product_id.eq": data.id } }
        );
        if (richData.length > 0) {
          richDesc = richData[0].content ?? "";
          richImgs = Array.isArray(richData[0].images) ? richData[0].images : [];
        }
      } catch (err) {
        console.error("Failed to fetch rich descriptions:", err);
      }

      return { product: data, productDetailsData, richDesc, richImgs };
    },
    enabled: !isNew,
  });

  // Duplicate product query — fetch source product when duplicating
  const { data: duplicateData } = useQuery({
    queryKey: queryKeys.products.detail(duplicateId ?? ""),
    queryFn: async () => {
      const data = await adminApi.getById<Product>("products", duplicateId!, {
        select: `
          id, name, slug, description, price, discount_price, stock_quantity,
          status, brand_id, original_url, metadata, created_at, updated_at,
          brands (id, name),
          product_variants (id, sku, name, price, discount_price, stock_quantity, status),
          product_images (id, url, alt_text, is_primary, sort_order, variant_id),
          product_categories (category_id)
        `,
      });

      let productDetailsData: ProductDetail[] = [];
      try {
        const details = await adminApi.getAll<{ id: string; type: string; content: string; sort_order: number }>(
          "product_details",
          { filters: { "product_id.eq": data.id }, order: "sort_order.asc" }
        );
        productDetailsData = details.map((d) => ({
          id: d.id,
          type: d.type,
          content: d.content,
        }));
      } catch { /* empty */ }

      let richDesc = "";
      let richImgs: string[] = [];
      try {
        const richData = await adminApi.getAll<{ content: string | null; images: string[] | null }>(
          "product_rich_descriptions",
          { filters: { "product_id.eq": data.id } }
        );
        if (richData.length > 0) {
          richDesc = richData[0].content ?? "";
          richImgs = Array.isArray(richData[0].images) ? richData[0].images : [];
        }
      } catch { /* empty */ }

      return { product: data, productDetailsData, richDesc, richImgs };
    },
    enabled: isNew && !!duplicateId,
  });

  // Populate form from duplicate source
  useEffect(() => {
    if (!duplicateData) return;
    const { product: data, productDetailsData: details } = duplicateData;

    setName(`${data.name} (хуулбар)`);
    const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const baseSlug = data.slug?.replace(/-copy-[a-z0-9]+$/, "") || "";
    setSlug(baseSlug ? `${baseSlug}-copy-${suffix}` : `product-copy-${suffix}`);
    setDescription(data.description || "");
    setStatus(data.status);
    setBrandId(data.brand_id);
    setOriginalUrl(data.original_url || "");

    const productImages = (data.product_images || [])
      .filter((img) => !img.variant_id)
      .sort((a, b) => a.sort_order - b.sort_order);
    setImages(productImages.map((img) => img.url));

    setCategoryIds((data.product_categories || []).map((pc) => pc.category_id));

    setVariants([{
      id: crypto.randomUUID(),
      sku: generateSku(),
      name: "",
      price: data.price?.toString() || "",
      discountPrice: data.discount_price?.toString() || "",
      stockQuantity: data.stock_quantity?.toString() || "0",
      attributes: {},
      images: [],
      details: [],
    }]);

    setProductDetails(details.map((d) => ({ ...d, id: crypto.randomUUID() })));
    setRichDescription(duplicateData.richDesc ?? "");
    setRichImages(Array.isArray(duplicateData.richImgs) ? duplicateData.richImgs : []);

    // Restore option groups and generated variants
    const metadata = data.metadata as { option_groups?: Array<{ type: string; values: string[]; is_required?: boolean }> } | null;
    if (metadata?.option_groups && Array.isArray(metadata.option_groups)) {
      const groupsWithIds: OptionGroup[] = metadata.option_groups.map((g, idx) => ({
        id: `group-${Date.now()}-${idx}`,
        type: g.type,
        values: g.values,
        is_required: g.is_required !== false,
      }));
      setOptionGroups(groupsWithIds);

      const variantNameToData = new Map<string, ProductVariant>();
      const variantIdToName = new Map<string, string>();
      if (data.product_variants?.length) {
        for (const v of data.product_variants) {
          if (v.name) {
            variantNameToData.set(v.name, v);
            variantIdToName.set(v.id, v.name);
          }
        }
      }

      const variantNameToImage = new Map<string, string>();
      if (data.product_images?.length) {
        for (const img of data.product_images) {
          if (img.variant_id) {
            const variantName = variantIdToName.get(img.variant_id);
            if (variantName && !variantNameToImage.has(variantName)) {
              variantNameToImage.set(variantName, img.url);
            }
          }
        }
      }

      const allCombinations = buildAllVariantCombinations(metadata.option_groups);
      if (allCombinations.length > 0) {
        const restored: GeneratedVariant[] = allCombinations.map((combo, idx) => {
          const combinationStr = combo.join(" / ");
          const existing = variantNameToData.get(combinationStr);
          return {
            id: `variant-${Date.now()}-${idx}`,
            combination: combinationStr,
            optionValues: combo,
            price: existing?.price?.toString() || data.price?.toString() || "",
            discountPrice: existing?.discount_price?.toString() || "",
            stockQuantity: existing?.stock_quantity?.toString() || "",
            sku: generateSku(),
            status: (existing?.status as "active" | "inactive") || "active",
            imageUrl: variantNameToImage.get(combinationStr) || "",
          };
        });
        setGeneratedVariants(restored);
      }
    }

    setDraftLoaded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duplicateData]);

  const product = productData?.product ?? null;

  // Sync product data into form state
  useEffect(() => {
    if (!productData) return;
    const { product: data, productDetailsData } = productData;

    setName(data.name);
    setSlug(data.slug || "");
    setDescription(data.description || "");
    setStatus(data.status);
    setBrandId(data.brand_id);
    setOriginalUrl(data.original_url || "");

    // Set product-level images (no variant_id)
    const productImages = (data.product_images || [])
      .filter((img) => !img.variant_id)
      .sort((a, b) => a.sort_order - b.sort_order);
    setImages(productImages.map((img) => img.url));

    // Set categories
    setCategoryIds(
      (data.product_categories || []).map((pc) => pc.category_id)
    );

    // Use product-level price and stock (no variants fetch)
    setVariants([{
      id: crypto.randomUUID(),
      sku: "",
      name: "",
      price: data.price?.toString() || "",
      discountPrice: data.discount_price?.toString() || "",
      stockQuantity: data.stock_quantity?.toString() || "0",
      attributes: {},
      images: [],
      details: [],
    }]);

    // Set product-level details
    setProductDetails(productDetailsData);

    // Set rich description and images
    setRichDescription(productData.richDesc ?? "");
    setRichImages(Array.isArray(productData.richImgs) ? productData.richImgs : []);

    // Load option groups from metadata
    const metadata = data.metadata as { option_groups?: Array<{ type: string; values: string[]; is_required?: boolean }> } | null;
    if (metadata?.option_groups && Array.isArray(metadata.option_groups)) {
      // Add id to each option group (not stored in metadata)
      const groupsWithIds: OptionGroup[] = metadata.option_groups.map((g, idx) => ({
        id: `group-${Date.now()}-${idx}`,
        type: g.type,
        values: g.values,
        is_required: g.is_required !== false, // default true for backward compat
      }));
      setOptionGroups(groupsWithIds);

      // Build variant data map: variant name -> full variant data
      const variantNameToData = new Map<string, ProductVariant>();
      const variantIdToName = new Map<string, string>();
      if (data.product_variants?.length) {
        for (const v of data.product_variants) {
          if (v.name) {
            variantNameToData.set(v.name, v);
            variantIdToName.set(v.id, v.name);
          }
        }
      }

      // Build variant image map: variant name -> image URL
      const variantNameToImage = new Map<string, string>();
      if (data.product_images?.length) {
        for (const img of data.product_images) {
          if (img.variant_id) {
            const variantName = variantIdToName.get(img.variant_id);
            if (variantName && !variantNameToImage.has(variantName)) {
              variantNameToImage.set(variantName, img.url);
            }
          }
        }
      }

      // Generate variant combinations: base (required) + extended (with optional)
      const allCombinations = buildAllVariantCombinations(metadata.option_groups);
      if (allCombinations.length > 0) {
        const restored: GeneratedVariant[] = allCombinations.map((combo, idx) => {
          const combinationStr = combo.join(" / ");
          const existing = variantNameToData.get(combinationStr);
          return {
            id: existing?.id || `variant-${Date.now()}-${idx}`,
            combination: combinationStr,
            optionValues: combo,
            price: existing?.price?.toString() || data.price?.toString() || "",
            discountPrice: existing?.discount_price?.toString() || "",
            stockQuantity: existing?.stock_quantity?.toString() || "",
            sku: existing?.sku || generateSku(),
            status: (existing?.status as "active" | "inactive") || "active",
            imageUrl: variantNameToImage.get(combinationStr) || "",
          };
        });
        setGeneratedVariants(restored);
      }
    }
  }, [productData]);

  const generateSlug = (text: string) => {
    // Remove Mongolian/Cyrillic characters, only allow a-z and 0-9
    const slug = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // If slug is empty (e.g., all Mongolian text), generate a random one
    if (!slug) {
      const random = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      return `product-${random}`;
    }
    return slug;
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, createEmptyVariant()]);
  };

  const removeVariant = (variantId: string) => {
    setVariants((prev) => {
      if (prev.length > 1) {
        return prev.filter((v) => v.id !== variantId);
      }
      return prev;
    });
  };

  const updateVariant = (
    variantId: string,
    field: keyof VariantForm,
    value: string | { [key: string]: string }
  ) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, [field]: value } : v))
    );
  };

  const updateVariantAttribute = (
    variantId: string,
    attributeId: string,
    valueId: string
  ) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.id === variantId
          ? { ...v, attributes: { ...v.attributes, [attributeId]: valueId } }
          : v
      )
    );
  };

  const updateVariantImages = (variantId: string, newImages: string[]) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.id === variantId ? { ...v, images: newImages } : v
      )
    );
  };

  const addVariantDetail = (variantId: string) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.id === variantId
          ? {
              ...v,
              details: [
                ...v.details,
                { id: crypto.randomUUID(), type: "" as VariantDetail["type"], content: "" },
              ],
            }
          : v
      )
    );
  };

  const removeVariantDetail = (variantId: string, detailId: string) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.id === variantId
          ? { ...v, details: v.details.filter((d) => d.id !== detailId) }
          : v
      )
    );
  };

  const updateVariantDetail = (
    variantId: string,
    detailId: string,
    field: "type" | "content",
    value: string
  ) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.id === variantId
          ? {
              ...v,
              details: v.details.map((d) =>
                d.id === detailId ? { ...d, [field]: value } : d
              ),
            }
          : v
      )
    );
  };

  // Product-level detail management
  const addProductDetail = () => {
    setProductDetails([
      ...productDetails,
      { id: crypto.randomUUID(), type: "", content: "" },
    ]);
  };

  const removeProductDetail = (detailId: string) => {
    setProductDetails(productDetails.filter((d) => d.id !== detailId));
  };

  const updateProductDetail = (
    detailId: string,
    field: "type" | "content",
    value: string
  ) => {
    setProductDetails(
      productDetails.map((d) =>
        d.id === detailId ? { ...d, [field]: value } : d
      )
    );
  };

  const reorderProductDetails = (fromIndex: number, toIndex: number) => {
    setProductDetails((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const toggleAttribute = (attributeId: string) => {
    if (selectedAttributes.includes(attributeId)) {
      setSelectedAttributes((prev) => prev.filter((a) => a !== attributeId));
      setVariants((prev) =>
        prev.map((v) => {
          const newAttrs = { ...v.attributes };
          delete newAttrs[attributeId];
          return { ...v, attributes: newAttrs };
        })
      );
    } else {
      setSelectedAttributes((prev) => [...prev, attributeId]);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const p_product = {
        id: isNew ? null : id,
        name: name.trim(),
        slug: slug.trim() || generateSlug(name),
        description: description.trim() || null,
        price: parseFloat(variants[0].price),
        discount_price: variants[0].discountPrice
          ? parseFloat(variants[0].discountPrice)
          : null,
        stock_quantity: parseInt(variants[0].stockQuantity) || 0,
        status,
        brand_id: brandId,
        original_url: originalUrl.trim() || null,
      };

      // Олон сонголттой бол generatedVariants, энгийн бол зөвхөн variants[0]
      const hasOptions = optionGroups.length > 0 && generatedVariants.length > 0;

      let p_variants: {
        id: string | null;
        sku: string | null;
        name: string | null;
        price: number;
        discount_price: number | null;
        stock_quantity: number;
        is_default: boolean;
        status: string;
        images: { url: string }[];
        option_values: string[];
      }[] = [];

      if (hasOptions) {
        // Олон сонголттой бүтээгдэхүүн - generatedVariants ашиглах
        const seen = new Set<string>();
        p_variants = generatedVariants
          .filter((v) => {
            if (seen.has(v.id)) return false;
            seen.add(v.id);
            return true;
          })
          .map((v, idx) => ({
            // Use existing ID if not a temp ID (temp IDs start with "variant-")
            id: v.id.startsWith("variant-") ? null : v.id,
            sku: v.sku || null,
            name: v.combination || null,
            price: parseFloat(v.price) || 0,
            discount_price: v.discountPrice ? parseFloat(v.discountPrice) : null,
            stock_quantity: parseInt(v.stockQuantity) || 0,
            is_default: idx === 0,
            status: v.status || "active",
            images: v.imageUrl ? [{ url: v.imageUrl }] : [],
            option_values: v.optionValues || [],
          }));
      } else {
        // Энгийн бүтээгдэхүүн - variant үүсгэхгүй
        p_variants = [];
      }

      const p_images = images.map((url) => ({ url }));

      // Product-level details (Нэмэлт мэдээлэл)
      const p_details = productDetails
        .filter((d) => d.type && d.content.trim())
        .map((d) => ({ type: d.type, content: d.content.trim() }));

      // Rich description (Дэлгэрэнгүй тайлбар) - тусдаа хүснэгтэд хадгална
      const p_rich_description = (richDescription.trim() || richImages.length > 0)
        ? { content: richDescription.trim(), images: richImages }
        : null;

      // Option groups (only type, values, is_required - no id needed for storage)
      const p_option_groups = optionGroups.length > 0
        ? optionGroups.map((g) => ({ type: g.type, values: g.values, is_required: g.is_required }))
        : null;

      await adminApi.rpc<string>("save_product", {
        p_product,
        p_variants,
        p_images,
        p_category_ids: categoryIds,
        p_details,
        p_rich_description,
        p_option_groups,
      });
    },
    onSuccess: () => {
      clearDraft();
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      router.push("/products");
    },
  });

  const handleSave = async () => {
    // Давхар хадгалахаас хамгаалах (ref ашиглан state update-ээс хурдан шалгана)
    if (savingRef.current) return;
    savingRef.current = true;

    setError(null);

    if (!name.trim()) {
      setError("Бүтээгдэхүүний нэрийг заавал оруулна уу.");
      savingRef.current = false;
      return;
    }

    if (images.length === 0) {
      setError("Дор хаяж нэг бүтээгдэхүүний зураг оруулна уу.");
      savingRef.current = false;
      return;
    }

    // Check if main product price is missing
    if (!variants[0]?.price || parseFloat(variants[0].price) <= 0) {
      setError("Бүтээгдэхүүний үнийг зөв оруулна уу. (0-ээс их байх ёстой)");
      savingRef.current = false;
      return;
    }

    // Check discount price is not greater than price
    if (
      variants[0]?.discountPrice &&
      parseFloat(variants[0].discountPrice) >= parseFloat(variants[0].price)
    ) {
      setError("Хямдралтай үнэ нь үндсэн үнээс бага байх ёстой.");
      savingRef.current = false;
      return;
    }

    // Check if additional variants have prices
    if (variants.slice(1).some((v) => !v.price || parseFloat(v.price) <= 0)) {
      setError("Бүх хувилбарт үнэ оруулна уу.");
      savingRef.current = false;
      return;
    }

    // Check generated variants have prices when option groups exist
    if (
      optionGroups.length > 0 &&
      generatedVariants.length > 0 &&
      generatedVariants.some((v) => !v.price || parseFloat(v.price) <= 0)
    ) {
      setError("Бүх сонголтын хувилбарт үнэ оруулна уу.");
      savingRef.current = false;
      return;
    }

    // Validate URL format if provided
    if (originalUrl.trim()) {
      try {
        new URL(originalUrl.trim());
      } catch {
        setError("Эх линк буруу байна. Зөв URL оруулна уу. (жишээ: https://example.com)");
        savingRef.current = false;
        return;
      }
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
    brands,
    categories,
    variants,
    addVariant,
    removeVariant,
    updateVariant,
    updateVariantAttribute,
    updateVariantImages,
    addVariantDetail,
    removeVariantDetail,
    updateVariantDetail,
    productDetails,
    addProductDetail,
    removeProductDetail,
    updateProductDetail,
    reorderProductDetails,
    selectedAttributes,
    toggleAttribute,
    availableAttributes,
    generateSlug,
    handleSave,
    richDescription,
    setRichDescription,
    richImages,
    setRichImages,
    optionGroups,
    setOptionGroups,
    generatedVariants,
    setGeneratedVariants,
  };
}
