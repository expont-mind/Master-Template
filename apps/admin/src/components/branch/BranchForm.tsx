"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useBranchEdit } from "@/hooks/useBranchEdit";

import { BranchBasicCard } from "./BranchBasicCard";
import { BranchContactCard } from "./BranchContactCard";
import { BranchEditHeader } from "./BranchEditHeader";
import { BranchImageUploadCard } from "./BranchImageUploadCard";
import { BranchInfoCard } from "./BranchInfoCard";
import { BranchSettingsCard } from "./BranchSettingsCard";

interface BranchFormProps {
  id: string;
}

export function BranchForm({ id }: BranchFormProps) {
  const {
    isNew,
    branch,
    isLoading,
    isSaving,
    error,
    name,
    setName,
    address,
    setAddress,
    phone,
    setPhone,
    email,
    setEmail,
    weekdayHours,
    setWeekdayHours,
    weekendHours,
    setWeekendHours,
    googleMapsUrl,
    setGoogleMapsUrl,
    imageUrl,
    setImageUrl,
    sortOrder,
    setSortOrder,
    isActive,
    setIsActive,
    handleSave,
  } = useBranchEdit(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isNew && !branch) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-lg font-medium">Салбар олдсонгүй</h3>
        <Link href="/branches">
          <Button variant="link">Буцах</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BranchEditHeader isNew={isNew} name={name} isSaving={isSaving} onSave={handleSave} />

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main content */}
        <div className="space-y-6">
          <BranchBasicCard
            name={name}
            onNameChange={setName}
            address={address}
            onAddressChange={setAddress}
            weekdayHours={weekdayHours}
            onWeekdayHoursChange={setWeekdayHours}
            weekendHours={weekendHours}
            onWeekendHoursChange={setWeekendHours}
          />
          <BranchContactCard
            phone={phone}
            onPhoneChange={setPhone}
            email={email}
            onEmailChange={setEmail}
            googleMapsUrl={googleMapsUrl}
            onGoogleMapsUrlChange={setGoogleMapsUrl}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <BranchSettingsCard
            isActive={isActive}
            onIsActiveChange={setIsActive}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />
          <BranchImageUploadCard
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            disabled={isSaving}
          />
          {!isNew && branch && <BranchInfoCard branch={branch} />}
        </div>
      </div>
    </div>
  );
}
