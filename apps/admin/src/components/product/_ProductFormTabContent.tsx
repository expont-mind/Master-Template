"use client";

import { ProductCategoryTab } from "./ProductCategoryTab";
import { ProductMainCard } from "./ProductMainCard";
import { ProductOptionsTab } from "./ProductOptionsTab";
import { ProductReviewsTab } from "./ProductReviewsTab";

import type { ProductFormTab } from "./_ProductFormTabs";
import type { useProductEdit } from "@/hooks/useProductEdit";

type ProductEditState = ReturnType<typeof useProductEdit>;

interface ProductFormTabContentProps {
  activeTab: ProductFormTab;
  productId: string;
  isNew: boolean;
  hasMultipleOptions: boolean;
  state: ProductEditState;
}

export function ProductFormTabContent({
  activeTab,
  productId,
  isNew,
  hasMultipleOptions,
  state,
}: ProductFormTabContentProps) {
  if (activeTab === "info") {
    return (
      <ProductMainCard
        name={state.name}
        setName={state.setName}
        description={state.description}
        setDescription={state.setDescription}
        brandId={state.brandId}
        setBrandId={state.setBrandId}
        originalUrl={state.originalUrl}
        setOriginalUrl={state.setOriginalUrl}
        brands={state.brands}
        variants={state.variants}
        updateVariant={state.updateVariant}
        productDetails={state.productDetails}
        addProductDetail={state.addProductDetail}
        removeProductDetail={state.removeProductDetail}
        updateProductDetail={state.updateProductDetail}
        reorderProductDetails={state.reorderProductDetails}
        richDescription={state.richDescription}
        setRichDescription={state.setRichDescription}
        richImages={state.richImages}
        setRichImages={state.setRichImages}
        generatedVariants={state.generatedVariants}
      />
    );
  }
  if (activeTab === "category") {
    return (
      <ProductCategoryTab
        categories={state.categories}
        categoryIds={state.categoryIds}
        setCategoryIds={state.setCategoryIds}
      />
    );
  }
  if (activeTab === "options" && hasMultipleOptions) {
    return (
      <ProductOptionsTab
        optionGroups={state.optionGroups}
        setOptionGroups={state.setOptionGroups}
        generatedVariants={state.generatedVariants}
        setGeneratedVariants={state.setGeneratedVariants}
        basePrice={state.variants[0]?.price || ""}
      />
    );
  }
  if (activeTab === "reviews" && !isNew) {
    return <ProductReviewsTab productId={productId} />;
  }
  return null;
}
