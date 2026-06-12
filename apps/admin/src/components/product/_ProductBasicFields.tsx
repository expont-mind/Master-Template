"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { BrandCombobox } from "./_BrandCombobox";
import { formatPrice, parsePrice } from "./_productMainHelpers";

import type { Brand, GeneratedVariant, VariantForm } from "./types";

interface ProductBasicFieldsProps {
  name: string;
  setName: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  brandId: string | null;
  setBrandId: (value: string | null) => void;
  originalUrl: string;
  setOriginalUrl: (value: string) => void;
  brands: Brand[];
  variants: VariantForm[];
  updateVariant: (id: string, field: keyof VariantForm, value: string) => void;
  generatedVariants?: GeneratedVariant[];
}

function getStockDisplay(
  variants: VariantForm[],
  generatedVariants?: GeneratedVariant[],
): { value: string; disabled: boolean; isMulti: boolean } {
  const hasMultipleOptions = !!generatedVariants && generatedVariants.length > 0;
  if (hasMultipleOptions) {
    const sum = generatedVariants.reduce((acc, v) => acc + (parseInt(v.stockQuantity) || 0), 0);
    return { value: sum.toString(), disabled: true, isMulti: true };
  }
  return {
    value: variants[0]?.stockQuantity ?? "",
    disabled: false,
    isMulti: false,
  };
}

export function ProductBasicFields({
  name,
  setName,
  description,
  setDescription,
  brandId,
  setBrandId,
  originalUrl,
  setOriginalUrl,
  brands,
  variants,
  updateVariant,
  generatedVariants,
}: ProductBasicFieldsProps) {
  const stockDisplay = getStockDisplay(variants, generatedVariants);
  const firstPrice = variants[0]?.price ?? "";
  const firstDiscount = variants[0]?.discountPrice ?? "";
  const firstSku = variants[0]?.sku ?? "";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Нэр</Label>
          <Input
            placeholder="Бүтээгдэхүүний нэрээ оруулна уу"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <BrandCombobox brands={brands} value={brandId} onChange={setBrandId} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Үнэ</Label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Бүтээгдэхүүний үнэ"
            value={formatPrice(firstPrice)}
            onChange={(e) => updateVariant(variants[0].id, "price", parsePrice(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Хямдарсан үнэ</Label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Хямдарсан үнэ"
            value={formatPrice(firstDiscount)}
            onChange={(e) =>
              updateVariant(variants[0].id, "discountPrice", parsePrice(e.target.value))
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Тоо ширхэг</Label>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Тоо ширхэг"
            value={stockDisplay.value}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "");
              updateVariant(variants[0].id, "stockQuantity", val);
            }}
            disabled={stockDisplay.disabled}
          />
          {stockDisplay.isMulti && (
            <p className="text-xs text-muted-foreground">
              Сонголтуудын нийлбэр тоо ширхэг (сонголт таб дээрээс удирдана)
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Код (SKU)</Label>
          <Input
            placeholder="Бүтээгдэхүүний код оруулна уу"
            value={firstSku}
            onChange={(e) => updateVariant(variants[0].id, "sku", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Эх линк</Label>
        <Input
          type="url"
          placeholder="https://example.com/product"
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Богино тайлбар</Label>
        <Textarea
          placeholder="Богино тайлбар оруулна уу"
          className="min-h-[100px] resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </div>
  );
}
