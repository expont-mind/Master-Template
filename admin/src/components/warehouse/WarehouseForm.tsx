"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useWarehouseEdit } from "@/hooks/useWarehouseEdit";
import { WarehouseEditHeader } from "./WarehouseEditHeader";
import { WarehouseBasicCard } from "./WarehouseBasicCard";
import { WarehouseContactCard } from "./WarehouseContactCard";
import { WarehouseSettingsCard } from "./WarehouseSettingsCard";
import { WarehouseInfoCard } from "./WarehouseInfoCard";

interface WarehouseFormProps {
  id: string;
}

export function WarehouseForm({ id }: WarehouseFormProps) {
  const {
    isNew,
    warehouse,
    isLoading,
    isSaving,
    error,
    name,
    setName,
    code,
    setCode,
    type,
    setType,
    address,
    setAddress,
    city,
    setCity,
    district,
    setDistrict,
    phone,
    setPhone,
    email,
    setEmail,
    managerName,
    setManagerName,
    isActive,
    setIsActive,
    isDefault,
    setIsDefault,
    nameColor,
    setNameColor,
    handleSave,
  } = useWarehouseEdit(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isNew && !warehouse) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-lg font-medium">Агуулах олдсонгүй</h3>
        <Link href="/warehouses">
          <Button variant="link">Буцах</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WarehouseEditHeader
        isNew={isNew}
        name={name}
        isSaving={isSaving}
        onSave={handleSave}
      />

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <WarehouseBasicCard
            name={name}
            onNameChange={setName}
            code={code}
            onCodeChange={setCode}
            nameColor={nameColor}
            onNameColorChange={setNameColor}
            address={address}
            onAddressChange={setAddress}
            city={city}
            onCityChange={setCity}
            district={district}
            onDistrictChange={setDistrict}
          />
          <WarehouseContactCard
            phone={phone}
            onPhoneChange={setPhone}
            email={email}
            onEmailChange={setEmail}
            managerName={managerName}
            onManagerNameChange={setManagerName}
          />
        </div>

        <div className="space-y-6">
          <WarehouseSettingsCard
            type={type}
            onTypeChange={setType}
            isActive={isActive}
            onIsActiveChange={setIsActive}
            isDefault={isDefault}
            onIsDefaultChange={setIsDefault}
          />
          {!isNew && warehouse && <WarehouseInfoCard warehouse={warehouse} />}
        </div>
      </div>
    </div>
  );
}
