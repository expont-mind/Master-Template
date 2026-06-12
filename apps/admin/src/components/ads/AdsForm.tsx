"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAdsEdit } from "@/hooks/useAdsEdit";

import { AdsContentCard } from "./AdsContentCard";
import { AdsEditHeader } from "./AdsEditHeader";
import { AdsInfoCard } from "./AdsInfoCard";
import { AdsSettingsCard } from "./AdsSettingsCard";

interface AdsFormProps {
  id: string;
}

export function AdsForm({ id }: AdsFormProps) {
  const {
    isNew,
    ad,
    isLoading,
    isSaving,
    error,
    title,
    setTitle,
    description,
    setDescription,
    imageUrl,
    setImageUrl,
    linkUrl,
    setLinkUrl,
    position,
    setPosition,
    isActive,
    setIsActive,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sortOrder,
    setSortOrder,
    handleSave,
  } = useAdsEdit(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isNew && !ad) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-lg font-medium">Зар олдсонгүй</h3>
        <Link href="/ads">
          <Button variant="link">Буцах</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdsEditHeader isNew={isNew} title={title} isSaving={isSaving} onSave={handleSave} />

      {error && <div className="bg-destructive/10 text-destructive p-4 rounded-lg">{error}</div>}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <AdsContentCard
            title={title}
            onTitleChange={setTitle}
            description={description}
            onDescriptionChange={setDescription}
            imageUrl={imageUrl}
            onImageUrlChange={setImageUrl}
            linkUrl={linkUrl}
            onLinkUrlChange={setLinkUrl}
          />
        </div>

        <div className="space-y-6">
          <AdsSettingsCard
            position={position}
            onPositionChange={setPosition}
            isActive={isActive}
            onIsActiveChange={setIsActive}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />
          {!isNew && ad && <AdsInfoCard ad={ad} />}
        </div>
      </div>
    </div>
  );
}
