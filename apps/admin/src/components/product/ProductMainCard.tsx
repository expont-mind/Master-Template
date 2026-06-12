"use client";

import { Card, CardContent } from "@/components/ui/card";

import { ProductBasicFields } from "./_ProductBasicFields";
import { ProductDetailsTable } from "./_ProductDetailsTable";
import { RichDescriptionEditor } from "./_RichDescriptionEditor";

import type { Brand, GeneratedVariant, VariantForm } from "./types";
import type { ProductDetail } from "@/hooks/useProductEdit";

interface ProductMainCardProps {
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
  productDetails: ProductDetail[];
  addProductDetail: () => void;
  removeProductDetail: (detailId: string) => void;
  updateProductDetail: (detailId: string, field: "type" | "content", value: string) => void;
  reorderProductDetails: (fromIndex: number, toIndex: number) => void;
  richDescription: string;
  setRichDescription: (value: string) => void;
  richImages: string[];
  setRichImages: (images: string[]) => void;
  generatedVariants?: GeneratedVariant[];
}

export function ProductMainCard({
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
  productDetails,
  addProductDetail,
  removeProductDetail,
  updateProductDetail,
  reorderProductDetails,
  richDescription,
  setRichDescription,
  richImages,
  setRichImages,
  generatedVariants,
}: ProductMainCardProps) {
  if (!variants.length) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-8">
          <h2 className="text-xl font-semibold">Бүтээгдэхүүний мэдээлэл</h2>

          <ProductBasicFields
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            brandId={brandId}
            setBrandId={setBrandId}
            originalUrl={originalUrl}
            setOriginalUrl={setOriginalUrl}
            brands={brands}
            variants={variants}
            updateVariant={updateVariant}
            generatedVariants={generatedVariants}
          />

          <RichDescriptionEditor
            value={richDescription}
            onChange={setRichDescription}
            images={richImages}
            onImagesChange={setRichImages}
          />

          <ProductDetailsTable
            productDetails={productDetails}
            addProductDetail={addProductDetail}
            removeProductDetail={removeProductDetail}
            updateProductDetail={updateProductDetail}
            reorderProductDetails={reorderProductDetails}
          />
        </CardContent>
      </Card>
    </div>
  );
}
