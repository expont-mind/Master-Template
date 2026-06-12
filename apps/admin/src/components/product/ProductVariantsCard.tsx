"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { VariantRow } from "./_VariantRow";

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
  updateVariantAttribute: (variantId: string, attributeId: string, valueId: string) => void;
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
            <CardDescription>Үнэ, нөөц, шинж чанараар ялгаатай хувилбарууд</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={addVariant}>
            <Plus className="mr-2 h-4 w-4" />
            Variant нэмэх
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {variants.map((variant, index) => (
          <VariantRow
            key={variant.id}
            variant={variant}
            index={index}
            isOnly={variants.length <= 1}
            removeVariant={removeVariant}
            updateVariant={updateVariant}
            updateVariantAttribute={updateVariantAttribute}
            updateVariantImages={updateVariantImages}
            selectedAttributes={selectedAttributes}
            availableAttributes={availableAttributes}
          />
        ))}
      </CardContent>
    </Card>
  );
}
