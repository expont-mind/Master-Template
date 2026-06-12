"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import type { Database } from "@/types/database";

type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

interface UseAddressFormArgs {
  addressId?: string;
  existingAddress?: AddressRow;
  onSave: () => void;
  onBack: () => void;
}

interface FormValues {
  name: string;
  city: string;
  district: string;
  khoroo: string;
  detail: string;
  isDefault: boolean;
}

function computeHasChanges(existing: AddressRow | undefined, current: FormValues): boolean {
  if (!existing) return true;
  return (
    current.name !== (existing.name || "") ||
    current.city !== (existing.city || "") ||
    current.district !== (existing.district || "") ||
    current.khoroo !== (existing.sub_district || "") ||
    current.detail !== (existing.detail || "") ||
    current.isDefault !== existing.is_default
  );
}

export function useAddressForm({ addressId, existingAddress, onSave, onBack }: UseAddressFormArgs) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [khoroo, setKhoroo] = useState("");
  const [detail, setDetail] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingAddress) {
      // Intentional one-time form prefill from saved address.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(existingAddress.name || "");
      setCity(existingAddress.city || "");
      setDistrict(existingAddress.district || "");
      setKhoroo(existingAddress.sub_district || "");
      setDetail(existingAddress.detail || "");
      setIsDefault(existingAddress.is_default);
    }
  }, [existingAddress]);

  const canSave = !!(city && district && khoroo && detail.trim());

  const hasChanges = computeHasChanges(existingAddress, {
    name,
    city,
    district,
    khoroo,
    detail,
    isDefault,
  });

  const handleSubmit = async () => {
    if (!canSave || !hasChanges) return;
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    if (isDefault) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    }

    if (addressId) {
      await supabase
        .from("addresses")
        .update({
          name,
          city,
          district,
          sub_district: khoroo,
          detail,
          is_default: isDefault,
        })
        .eq("id", addressId);
    } else {
      await supabase.from("addresses").insert({
        user_id: user.id,
        name,
        city,
        district,
        sub_district: khoroo,
        detail,
        is_default: isDefault,
      });
    }

    setSaving(false);
    onSave();
    onBack();
  };

  return {
    name,
    setName,
    city,
    setCity,
    district,
    setDistrict,
    khoroo,
    setKhoroo,
    detail,
    setDetail,
    isDefault,
    setIsDefault,
    saving,
    canSave,
    hasChanges,
    handleSubmit,
  };
}

export type AddressFormState = ReturnType<typeof useAddressForm>;
