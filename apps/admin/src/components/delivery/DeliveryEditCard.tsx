"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { DeliveryBasicCard } from "./_DeliveryBasicCard";
import { DeliveryDaysCard } from "./_DeliveryDaysCard";
import { DeliveryPricingCard } from "./_DeliveryPricingCard";
import { DeliverySettingsCard } from "./_DeliverySettingsCard";

interface DeliveryEditCardProps {
  name: string;
  description: string;
  deliveryFee: number;
  freeDeliveryThreshold: number | null;
  isFreeDeliveryEnabled: boolean;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive: boolean;
  sortOrder: number;
  isLoading: boolean;
  error: string | null;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDeliveryFeeChange: (value: number) => void;
  onFreeDeliveryThresholdChange: (value: number | null) => void;
  onIsFreeDeliveryEnabledChange: (value: boolean) => void;
  onEstimatedDaysMinChange: (value: number) => void;
  onEstimatedDaysMaxChange: (value: number) => void;
  onIsActiveChange: (value: boolean) => void;
  onSortOrderChange: (value: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function DeliveryEditCard({
  name,
  description,
  deliveryFee,
  freeDeliveryThreshold,
  isFreeDeliveryEnabled,
  estimatedDaysMin,
  estimatedDaysMax,
  isActive,
  sortOrder,
  isLoading,
  error,
  onNameChange,
  onDescriptionChange,
  onDeliveryFeeChange,
  onFreeDeliveryThresholdChange,
  onIsFreeDeliveryEnabledChange,
  onEstimatedDaysMinChange,
  onEstimatedDaysMaxChange,
  onIsActiveChange,
  onSortOrderChange,
  onSubmit,
}: DeliveryEditCardProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl mx-auto">
      {error && <div className="bg-destructive/10 text-destructive p-4 rounded-lg">{error}</div>}

      <DeliveryBasicCard
        name={name}
        description={description}
        onNameChange={onNameChange}
        onDescriptionChange={onDescriptionChange}
      />

      <DeliveryPricingCard
        deliveryFee={deliveryFee}
        freeDeliveryThreshold={freeDeliveryThreshold}
        isFreeDeliveryEnabled={isFreeDeliveryEnabled}
        onDeliveryFeeChange={onDeliveryFeeChange}
        onFreeDeliveryThresholdChange={onFreeDeliveryThresholdChange}
        onIsFreeDeliveryEnabledChange={onIsFreeDeliveryEnabledChange}
      />

      <DeliveryDaysCard
        estimatedDaysMin={estimatedDaysMin}
        estimatedDaysMax={estimatedDaysMax}
        onEstimatedDaysMinChange={onEstimatedDaysMinChange}
        onEstimatedDaysMaxChange={onEstimatedDaysMaxChange}
      />

      <DeliverySettingsCard
        isActive={isActive}
        sortOrder={sortOrder}
        onIsActiveChange={onIsActiveChange}
        onSortOrderChange={onSortOrderChange}
      />

      <div className="flex justify-end gap-4">
        <Link href="/deliveries">
          <Button type="button" variant="outline">
            Болих
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Хадгалж байна...
            </>
          ) : (
            "Хадгалах"
          )}
        </Button>
      </div>
    </form>
  );
}
