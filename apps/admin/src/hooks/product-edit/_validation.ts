import type { VariantForm, GeneratedVariant, OptionGroup } from "@/components/product/types";

type ValidationInput = {
  name: string;
  images: string[];
  variants: VariantForm[];
  optionGroups: OptionGroup[];
  generatedVariants: GeneratedVariant[];
  originalUrl: string;
};

function validateRequiredFields(input: ValidationInput): string | null {
  if (!input.name.trim()) {
    return "Бүтээгдэхүүний нэрийг заавал оруулна уу.";
  }
  if (input.images.length === 0) {
    return "Дор хаяж нэг бүтээгдэхүүний зураг оруулна уу.";
  }
  return null;
}

function validatePrices(input: ValidationInput): string | null {
  const first = input.variants[0];
  if (!first?.price || parseFloat(first.price) <= 0) {
    return "Бүтээгдэхүүний үнийг зөв оруулна уу. (0-ээс их байх ёстой)";
  }
  if (first.discountPrice && parseFloat(first.discountPrice) >= parseFloat(first.price)) {
    return "Хямдралтай үнэ нь үндсэн үнээс бага байх ёстой.";
  }
  if (input.variants.slice(1).some((v) => !v.price || parseFloat(v.price) <= 0)) {
    return "Бүх хувилбарт үнэ оруулна уу.";
  }
  if (
    input.optionGroups.length > 0 &&
    input.generatedVariants.length > 0 &&
    input.generatedVariants.some((v) => !v.price || parseFloat(v.price) <= 0)
  ) {
    return "Бүх сонголтын хувилбарт үнэ оруулна уу.";
  }
  return null;
}

function validateUrl(originalUrl: string): string | null {
  const trimmed = originalUrl.trim();
  if (!trimmed) return null;
  try {
    new URL(trimmed);
    return null;
  } catch {
    return "Эх линк буруу байна. Зөв URL оруулна уу. (жишээ: https://example.com)";
  }
}

export function validateProductForm(input: ValidationInput): string | null {
  return validateRequiredFields(input) ?? validatePrices(input) ?? validateUrl(input.originalUrl);
}

export function generateSlug(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    const random = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    return `product-${random}`;
  }
  return slug;
}
