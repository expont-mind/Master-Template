"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { stripPhonePrefix } from "@/lib/utils/formatters";

import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export interface PersonalFormData {
  lastName: string;
  firstName: string;
  email: string;
  phone1: string;
  phone2: string;
}

export interface PersonalFieldErrors {
  lastName?: string;
  firstName?: string;
  phone1?: string;
}

function makeInitial(user: UserRow | null): PersonalFormData {
  return {
    lastName: user?.last_name ?? "",
    firstName: user?.first_name ?? "",
    email: user?.email ?? "",
    phone1: stripPhonePrefix(user?.primary_phone ?? ""),
    phone2: stripPhonePrefix(user?.secondary_phone ?? ""),
  };
}

function computeErrors(
  formData: PersonalFormData,
  touched: Record<string, boolean>,
): PersonalFieldErrors {
  const errors: PersonalFieldErrors = {};
  if (touched.lastName && !formData.lastName.trim()) errors.lastName = "Овог оруулна уу";
  if (touched.firstName && !formData.firstName.trim()) errors.firstName = "Нэр оруулна уу";
  if (touched.phone1 && !formData.phone1.trim()) errors.phone1 = "Утас оруулна уу";
  return errors;
}

function hasFormChanges(formData: PersonalFormData, user: UserRow | null): boolean {
  return (
    formData.lastName !== (user?.last_name ?? "") ||
    formData.firstName !== (user?.first_name ?? "") ||
    formData.phone1 !== stripPhonePrefix(user?.primary_phone ?? "") ||
    formData.phone2 !== stripPhonePrefix(user?.secondary_phone ?? "")
  );
}

export function usePersonalForm(user: UserRow | null, onRefresh: () => Promise<void>) {
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PersonalFormData>(makeInitial(user));

  useEffect(() => {
    // Intentional form reset when the underlying user record changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(makeInitial(user));
    setTouched({});
    setSaveError(null);
  }, [user]);

  const errors = computeErrors(formData, touched);
  const hasChanges = hasFormChanges(formData, user);

  const setField = (field: keyof PersonalFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaveError(null);

    if (!formData.lastName.trim() || !formData.firstName.trim() || !formData.phone1.trim()) {
      setTouched({ lastName: true, firstName: true, phone1: true });
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("users")
      .update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        primary_phone: stripPhonePrefix(formData.phone1),
        secondary_phone: formData.phone2 ? stripPhonePrefix(formData.phone2) : null,
      })
      .eq("id", user.id);

    if (error) {
      setSaveError("Хадгалахад алдаа гарлаа. Дахин оролдоно уу.");
    } else {
      await onRefresh();
      setTouched({});
    }
    setLoading(false);
  };

  return {
    formData,
    errors,
    loading,
    saveError,
    hasChanges,
    setField,
    handleBlur,
    handleSave,
  };
}
