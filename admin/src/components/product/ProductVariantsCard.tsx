"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { MultiImageUpload } from "@/components/ui/image-upload";
import type { VariantForm, Attribute } from "./types";

interface ProductVariantsCardProps {
  variants: VariantForm[];
  addVariant: () => void;
  removeVariant: (id: string) => void;
  updateVariant: (
    id: string,
    field: keyof VariantForm,
    value: string | { [key: string]: string },
  ) => void;
  updateVariantAttribute: (
    variantId: string,
    attributeId: string,
    valueId: string,
  ) => void;
  updateVariantImages: (variantId: string, images: string[]) => void;
  selectedAttributes: string[];
  availableAttributes: Attribute[];
}

export function ProductVariantsCard({
  variants,
  addVariant,
  removeVariant,
  updateVariant,
  updateVariantAttribute,
  updateVariantImages,
  selectedAttributes,
  availableAttributes,
}: ProductVariantsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Variants (SKU)</CardTitle>
            <CardDescription>
              Үнэ, нөөц, шинж чанараар ялгаатай хувилбарууд
            </CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={addVariant}>
            <Plus className="mr-2 h-4 w-4" />
            Variant нэмэх
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {variants.map((variant, index) => (
          <div key={variant.id} className="space-y-4">
            {index > 0 && <Separator />}
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Variant #{index + 1}</h4>
              {variants.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeVariant(variant.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={variant.sku}
                  onChange={(e) =>
                    updateVariant(variant.id, "sku", e.target.value)
                  }
                  placeholder="SKU-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Variant нэр</Label>
                <Input
                  value={variant.name}
                  onChange={(e) =>
                    updateVariant(variant.id, "name", e.target.value)
                  }
                  placeholder="Улаан - M хэмжээ"
                />
              </div>
              <div className="space-y-2">
                <Label>Үнэ *</Label>
                <Input
                  type="number"
                  value={variant.price}
                  onChange={(e) =>
                    updateVariant(variant.id, "price", e.target.value)
                  }
                  placeholder="50000"
                />
              </div>
              <div className="space-y-2">
                <Label>Хямдралтай үнэ</Label>
                <Input
                  type="number"
                  value={variant.discountPrice}
                  onChange={(e) =>
                    updateVariant(variant.id, "discountPrice", e.target.value)
                  }
                  placeholder="45000"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Нөөц</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={variant.stockQuantity}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    updateVariant(variant.id, "stockQuantity", val);
                  }}
                  placeholder="10"
                />
              </div>

              {selectedAttributes.map((attrId) => {
                const attr = availableAttributes.find((a) => a.id === attrId);
                if (!attr) return null;
                return (
                  <div key={attrId} className="space-y-2">
                    <Label>{attr.display_name}</Label>
                    <Select
                      value={variant.attributes[attrId] || ""}
                      onValueChange={(v) =>
                        updateVariantAttribute(variant.id, attrId, v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={`${attr.display_name} сонгох`}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {attr.values.map((val) => (
                          <SelectItem key={val.id} value={val.id}>
                            <div className="flex items-center gap-2">
                              {val.color_hex && (
                                <div
                                  className="h-4 w-4 rounded-full border"
                                  style={{ backgroundColor: val.color_hex }}
                                />
                              )}
                              {val.display_value}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label>Variant зураг</Label>
              <MultiImageUpload
                values={variant.images}
                onChange={(imgs) => updateVariantImages(variant.id, imgs)}
                maxImages={1}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
