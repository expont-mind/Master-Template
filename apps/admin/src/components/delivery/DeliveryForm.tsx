"use client";

import { Loader2 } from "lucide-react";

import { useDeliveryEdit } from "@/hooks/useDeliveryEdit";

import { DeliveryEditCard } from "./DeliveryEditCard";
import { DeliveryEditHeader } from "./DeliveryEditHeader";

interface DeliveryFormProps {
  id: string;
}

export function DeliveryForm({ id }: DeliveryFormProps) {
  const {
    isNew,
    isLoading,
    error,
    currentZone,
    name,
    description,
    deliveryFee,
    freeDeliveryThreshold,
    isFreeDeliveryEnabled,
    estimatedDaysMin,
    estimatedDaysMax,
    isActive,
    sortOrder,
    setName,
    setDescription,
    setDeliveryFee,
    setFreeDeliveryThreshold,
    setIsFreeDeliveryEnabled,
    setEstimatedDaysMin,
    setEstimatedDaysMax,
    setIsActive,
    setSortOrder,
    handleSubmit,
  } = useDeliveryEdit(id);

  if (!isNew && !currentZone) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DeliveryEditHeader isNew={isNew} />
      <DeliveryEditCard
        name={name}
        description={description}
        deliveryFee={deliveryFee}
        freeDeliveryThreshold={freeDeliveryThreshold}
        isFreeDeliveryEnabled={isFreeDeliveryEnabled}
        estimatedDaysMin={estimatedDaysMin}
        estimatedDaysMax={estimatedDaysMax}
        isActive={isActive}
        sortOrder={sortOrder}
        isLoading={isLoading}
        error={error}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onDeliveryFeeChange={setDeliveryFee}
        onFreeDeliveryThresholdChange={setFreeDeliveryThreshold}
        onIsFreeDeliveryEnabledChange={setIsFreeDeliveryEnabled}
        onEstimatedDaysMinChange={setEstimatedDaysMin}
        onEstimatedDaysMaxChange={setEstimatedDaysMax}
        onIsActiveChange={setIsActive}
        onSortOrderChange={setSortOrder}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
