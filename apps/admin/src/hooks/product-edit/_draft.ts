// Draft persistence for the product-edit hook tree.
//
// Drafts live in localStorage so a user can refresh the admin tab
// mid-edit without losing work. Size and age caps prevent two known
// failure modes:
// - Oversized base64-pasted images blowing past localStorage quota
// - Shared admin workstations handing stale drafts between shifts

import type { VariantForm, OptionGroup, GeneratedVariant } from "@/components/product/types";

export interface ProductDetail {
  id: string;
  type: string;
  content: string;
}

export interface DraftData {
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

const DRAFT_KEY = "product_draft";
const DRAFT_MAX_BYTES = 50 * 1024;
const DRAFT_MAX_AGE_MS = 60 * 60 * 1000;

export function saveDraft(data: Omit<DraftData, "savedAt">) {
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
}

export function loadDraft(): DraftData | null {
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
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
