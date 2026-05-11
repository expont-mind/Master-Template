"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProductEdit } from "@/hooks/useProductEdit";
import { ProductEditHeader } from "./ProductEditHeader";
import { ProductMainCard } from "./ProductMainCard";
import { ProductCategoryTab } from "./ProductCategoryTab";
import { ProductOptionsTab } from "./ProductOptionsTab";
import { ProductStatusCard } from "./ProductStatusCard";
import { ProductImageUploadCard } from "./ProductImageUploadCard";
import { ProductReviewsTab } from "./ProductReviewsTab";

interface ProductFormProps {
  id: string;
  duplicateId?: string;
}

type Tab = "info" | "category" | "options" | "reviews";

export function ProductForm({ id, duplicateId }: ProductFormProps) {
  const {
    product,
    isNew,
    isLoading,
    isSaving,
    error,
    name,
    setName,
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
    brands,
    categories,
    categoryIds,
    setCategoryIds,
    variants,
    updateVariant,
    productDetails,
    addProductDetail,
    removeProductDetail,
    updateProductDetail,
    reorderProductDetails,
    handleSave,
    richDescription,
    setRichDescription,
    richImages,
    setRichImages,
    optionGroups,
    setOptionGroups,
    generatedVariants,
    setGeneratedVariants,
  } = useProductEdit(id, duplicateId);

  const [activeTab, setActiveTab] = useState<Tab>("info");
  // Local state for new fields (not yet in DB)
  const [manageQuantity, setManageQuantity] = useState(true);
  const [hasMultipleOptions, setHasMultipleOptions] = useState(false);
  const [isDeliverable, setIsDeliverable] = useState(true);
  const [isTicket, setIsTicket] = useState(false);
  const [hidePrice, setHidePrice] = useState(false);
  const [acceptFileOrImage, setAcceptFileOrImage] = useState(false);

  // Auto-enable hasMultipleOptions when optionGroups exist
  useEffect(() => {
    if (optionGroups.length > 0 && !hasMultipleOptions) {
      setHasMultipleOptions(true);
    }
  }, [optionGroups.length, hasMultipleOptions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isNew && !product) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-lg font-medium">Бүтээгдэхүүн олдсонгүй</h3>
        <Link href="/products">
          <Button variant="link">Буцах</Button>
        </Link>
      </div>
    );
  }

  const tabs: { value: Tab; label: string; show?: boolean }[] = [
    { value: "info", label: "Мэдээлэл" },
    { value: "category", label: "Веб ангилал" },
    { value: "options", label: "Сонголт", show: hasMultipleOptions },
    { value: "reviews", label: "Сэтгэгдэл", show: !isNew },
  ];

  return (
    <div className="space-y-6">
      <ProductEditHeader
        isNew={isNew}
        isSaving={isSaving}
        onSave={handleSave}
      />

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main content */}
        <div className="space-y-0">
          {/* Tab selector */}
          <div className="flex border-b mb-6">
            {tabs
              .filter((tab) => tab.show !== false)
              .map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "px-4 py-2.5 text-sm font-medium transition-colors relative",
                    activeTab === tab.value
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                  {activeTab === tab.value && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t" />
                  )}
                </button>
              ))}
          </div>

          {/* Tab content */}
          {activeTab === "info" && (
            <ProductMainCard
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
              productDetails={productDetails}
              addProductDetail={addProductDetail}
              removeProductDetail={removeProductDetail}
              updateProductDetail={updateProductDetail}
              reorderProductDetails={reorderProductDetails}
              richDescription={richDescription}
              setRichDescription={setRichDescription}
              richImages={richImages}
              setRichImages={setRichImages}
              generatedVariants={generatedVariants}
            />
          )}
          {activeTab === "category" && (
            <ProductCategoryTab
              categories={categories}
              categoryIds={categoryIds}
              setCategoryIds={setCategoryIds}
            />
          )}
          {activeTab === "options" && hasMultipleOptions && (
            <ProductOptionsTab
              optionGroups={optionGroups}
              setOptionGroups={setOptionGroups}
              generatedVariants={generatedVariants}
              setGeneratedVariants={setGeneratedVariants}
              basePrice={variants[0]?.price || ""}
            />
          )}
          {activeTab === "reviews" && !isNew && (
            <ProductReviewsTab productId={id} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ProductStatusCard
            status={status}
            setStatus={setStatus}
            manageQuantity={manageQuantity}
            setManageQuantity={setManageQuantity}
            hasMultipleOptions={hasMultipleOptions}
            setHasMultipleOptions={setHasMultipleOptions}
            isDeliverable={isDeliverable}
            setIsDeliverable={setIsDeliverable}
            isTicket={isTicket}
            setIsTicket={setIsTicket}
            hidePrice={hidePrice}
            setHidePrice={setHidePrice}
            acceptFileOrImage={acceptFileOrImage}
            setAcceptFileOrImage={setAcceptFileOrImage}
          />

          <ProductImageUploadCard
            images={images}
            setImages={setImages}
            disabled={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
