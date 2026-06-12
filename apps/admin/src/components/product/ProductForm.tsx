"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useProductEdit } from "@/hooks/useProductEdit";

import { ProductFormTabContent } from "./_ProductFormTabContent";
import { buildProductFormTabs, ProductFormTabs, type ProductFormTab } from "./_ProductFormTabs";
import { useProductFormFlags } from "./_useProductFormFlags";
import { ProductEditHeader } from "./ProductEditHeader";
import { ProductImageUploadCard } from "./ProductImageUploadCard";
import { ProductStatusCard } from "./ProductStatusCard";

interface ProductFormProps {
  id: string;
  duplicateId?: string;
}

export function ProductForm({ id, duplicateId }: ProductFormProps) {
  const state = useProductEdit(id, duplicateId);
  const { product, isNew, isLoading, isSaving, error } = state;

  const [activeTab, setActiveTab] = useState<ProductFormTab>("info");
  const flags = useProductFormFlags(state.optionGroups.length);

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

  const tabs = buildProductFormTabs({
    hasMultipleOptions: flags.hasMultipleOptions,
    isNew,
  });

  return (
    <div className="space-y-6">
      <ProductEditHeader isNew={isNew} isSaving={isSaving} onSave={state.handleSave} />

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main content */}
        <div className="space-y-0">
          <ProductFormTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          <ProductFormTabContent
            activeTab={activeTab}
            productId={id}
            isNew={isNew}
            hasMultipleOptions={flags.hasMultipleOptions}
            state={state}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ProductStatusCard
            status={state.status}
            setStatus={state.setStatus}
            manageQuantity={flags.manageQuantity}
            setManageQuantity={flags.setManageQuantity}
            hasMultipleOptions={flags.hasMultipleOptions}
            setHasMultipleOptions={flags.setHasMultipleOptions}
            isDeliverable={flags.isDeliverable}
            setIsDeliverable={flags.setIsDeliverable}
            isTicket={flags.isTicket}
            setIsTicket={flags.setIsTicket}
            hidePrice={flags.hidePrice}
            setHidePrice={flags.setHidePrice}
            acceptFileOrImage={flags.acceptFileOrImage}
            setAcceptFileOrImage={flags.setAcceptFileOrImage}
          />

          <ProductImageUploadCard
            images={state.images}
            setImages={state.setImages}
            disabled={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
