"use client";

import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useCouponEdit } from "@/hooks/useCouponEdit";

import { CouponBasicSection } from "./_CouponBasicSection";
import { CouponDiscountSection } from "./_CouponDiscountSection";
import { CouponScopeSection } from "./_CouponScopeSection";
import { CouponSidebar } from "./_CouponSidebar";
import { CouponUsageSection } from "./_CouponUsageSection";

interface CouponFormProps {
  id?: string;
}

function CouponFormHeader({
  isEditMode,
  isSaving,
  onSave,
}: {
  isEditMode: boolean;
  isSaving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/coupons">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{isEditMode ? "Купон засах" : "Шинэ купон"}</h1>
          <p className="text-muted-foreground">
            {isEditMode ? "Купоны мэдээллийг засварлана уу" : "Шинэ купон үүсгэнэ үү"}
          </p>
        </div>
      </div>
      <Button onClick={onSave} disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Хадгалж байна...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Хадгалах
          </>
        )}
      </Button>
    </div>
  );
}

export function CouponForm({ id }: CouponFormProps) {
  const {
    coupon,
    formData,
    isLoading,
    isSaving,
    error,
    isEditMode,
    deliveryFee,
    scopeItemIds,
    setScopeItemIds,
    scopeItemNames,
    setScopeItemNames,
    scopeItems,
    scopeSearch,
    setScopeSearch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchingScopeItems,
    updateFormData,
    generateCode,
    handleSave,
  } = useCouponEdit(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CouponFormHeader isEditMode={isEditMode} isSaving={isSaving} onSave={handleSave} />

      {error && <div className="bg-destructive/10 text-destructive p-4 rounded-lg">{error}</div>}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <CouponBasicSection
            code={formData.code}
            onCodeChange={(code) => updateFormData({ code })}
            onGenerateCode={generateCode}
          />
          <CouponDiscountSection
            formData={formData}
            deliveryFee={deliveryFee}
            updateFormData={updateFormData}
          />
          <CouponScopeSection
            formData={formData}
            updateFormData={updateFormData}
            scopeItemIds={scopeItemIds}
            setScopeItemIds={setScopeItemIds}
            scopeItemNames={scopeItemNames}
            setScopeItemNames={setScopeItemNames}
            scopeItems={scopeItems}
            scopeSearch={scopeSearch}
            setScopeSearch={setScopeSearch}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isFetchingScopeItems={isFetchingScopeItems}
          />
          <CouponUsageSection
            formData={formData}
            updateFormData={updateFormData}
            isEditMode={isEditMode}
            coupon={coupon}
          />
        </div>

        <CouponSidebar formData={formData} updateFormData={updateFormData} />
      </div>
    </div>
  );
}
