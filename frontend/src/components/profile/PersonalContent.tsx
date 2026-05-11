"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { stripPhonePrefix } from "@/lib/utils/formatters";
import { Slash } from "../svg";
import Link from "next/link";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

interface PersonalContentProps {
  user: UserRow | null;
  onRefresh: () => Promise<void>;
}

interface FieldErrors {
  lastName?: string;
  firstName?: string;
  phone1?: string;
}

export const PersonalContent = ({ user, onRefresh }: PersonalContentProps) => {
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    lastName: user?.last_name ?? "",
    firstName: user?.first_name ?? "",
    email: user?.email ?? "",
    phone1: stripPhonePrefix(user?.primary_phone ?? ""),
    phone2: stripPhonePrefix(user?.secondary_phone ?? ""),
  });

  // Sync formData when user prop changes
  useEffect(() => {
    setFormData({
      lastName: user?.last_name ?? "",
      firstName: user?.first_name ?? "",
      email: user?.email ?? "",
      phone1: stripPhonePrefix(user?.primary_phone ?? ""),
      phone2: stripPhonePrefix(user?.secondary_phone ?? ""),
    });
    setTouched({});
    setSaveError(null);
  }, [user]);

  const errors: FieldErrors = {};
  if (touched.lastName && !formData.lastName.trim())
    errors.lastName = "Овог оруулна уу";
  if (touched.firstName && !formData.firstName.trim())
    errors.firstName = "Нэр оруулна уу";
  if (touched.phone1 && !formData.phone1.trim())
    errors.phone1 = "Утас оруулна уу";

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaveError(null);

    if (
      !formData.lastName.trim() ||
      !formData.firstName.trim() ||
      !formData.phone1.trim()
    ) {
      setTouched({
        lastName: true,
        firstName: true,
        phone1: true,
      });
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
        secondary_phone: formData.phone2
          ? stripPhonePrefix(formData.phone2)
          : null,
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

  const inputBaseClass =
    "w-full h-12 pl-3 pr-0.5 bg-white border rounded-sm text-base font-manrope placeholder:text-text-secondary text-text-primary focus:outline-none transition-colors duration-200";
  const inputNormalBorder = "border-border focus:border-text-primary";
  const inputErrorBorder = "border-accent-rose focus:border-accent-rose";

  const hasChanges =
    formData.lastName !== (user?.last_name ?? "") ||
    formData.firstName !== (user?.first_name ?? "") ||
    formData.phone1 !== stripPhonePrefix(user?.primary_phone ?? "") ||
    formData.phone2 !== stripPhonePrefix(user?.secondary_phone ?? "");

  return (
    <div className="flex flex-col gap-4 md:gap-2">
      {/* Header */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 px-px md:px-0.5">
          <Link
            href="/profile"
            className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
          >
            Профайл
          </Link>
          <Slash />

          <p className="text-slate-950 text-sm font-normal font-manrope">
            Хувийн мэдээлэл
          </p>
        </div>

        <p className="px-0 md:px-0.5 pb-0 md:pb-3 text-[#020617] font-bold md:font-semibold text-2xl md:text-xl font-manrope">
          Хувийн мэдээлэл
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Last Name & First Name */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex flex-col gap-0.5">
            <label
              htmlFor="checkout-lastName"
              className="text-text-primary font-normal text-sm font-manrope"
            >
              Овог
              <span className="text-accent-rose text-base">*</span>
            </label>
            <input
              id="checkout-lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, lastName: e.target.value }))
              }
              onBlur={() => handleBlur("lastName")}
              placeholder="Овог"
              aria-invalid={!!errors.lastName}
              aria-describedby={
                errors.lastName ? "checkout-lastName-error" : undefined
              }
              className={`${inputBaseClass} ${errors.lastName ? inputErrorBorder : inputNormalBorder}`}
            />
            {errors.lastName && (
              <p
                id="checkout-lastName-error"
                className="text-accent-rose text-xs font-manrope mt-0.5"
              >
                {errors.lastName}
              </p>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-0.5">
            <label
              htmlFor="checkout-firstName"
              className="text-text-primary font-normal text-sm font-manrope"
            >
              Нэр
              <span className="text-accent-rose text-base">*</span>
            </label>
            <input
              id="checkout-firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, firstName: e.target.value }))
              }
              onBlur={() => handleBlur("firstName")}
              placeholder="Нэр"
              aria-invalid={!!errors.firstName}
              aria-describedby={
                errors.firstName ? "checkout-firstName-error" : undefined
              }
              className={`${inputBaseClass} ${errors.firstName ? inputErrorBorder : inputNormalBorder}`}
            />
            {errors.firstName && (
              <p
                id="checkout-firstName-error"
                className="text-accent-rose text-xs font-manrope mt-0.5"
              >
                {errors.firstName}
              </p>
            )}
          </div>
        </div>

        {/* Phone 1 & Phone 2 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex flex-col gap-0.5">
            <label
              htmlFor="checkout-phone1"
              className="text-text-primary font-normal text-sm font-manrope"
            >
              Утас - 1<span className="text-accent-rose text-base">*</span>
            </label>
            <div
              className={`group flex h-12 border rounded-sm overflow-hidden ${errors.phone1 ? inputErrorBorder : "border-border focus-within:border-text-primary transition-all duration-200"}`}
            >
              <div className="flex items-center px-3 border-r border-border group-focus-within:border-text-primary transition-colors duration-200">
                <span className="text-text-secondary font-medium text-base font-manrope whitespace-nowrap">
                  +976
                </span>
              </div>
              <input
                id="checkout-phone1"
                type="tel"
                value={formData.phone1}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone1: e.target.value }))
                }
                onBlur={() => handleBlur("phone1")}
                placeholder="Утас-1"
                aria-invalid={!!errors.phone1}
                aria-describedby={
                  errors.phone1 ? "checkout-phone1-error" : undefined
                }
                className="flex-1 px-3 bg-white text-base font-medium font-manrope placeholder:text-text-secondary text-text-primary focus:outline-none"
              />
            </div>
            {errors.phone1 && (
              <p
                id="checkout-phone1-error"
                className="text-accent-rose text-xs font-manrope mt-0.5"
              >
                {errors.phone1}
              </p>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-0.5">
            <label
              htmlFor="checkout-phone2"
              className="text-text-primary font-normal text-sm font-manrope"
            >
              Утас - 2<span className="text-accent-rose text-base">*</span>
            </label>
            <div
              className={`group flex h-12 border rounded-sm overflow-hidden border-border focus-within:border-text-primary transition-all duration-200`}
            >
              <div className="flex items-center px-3 border-r border-border group-focus-within:border-text-primary transition-colors duration-200">
                <span className="text-text-secondary font-medium text-base font-manrope whitespace-nowrap">
                  +976
                </span>
              </div>
              <input
                id="checkout-phone2"
                type="tel"
                value={formData.phone2}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone2: e.target.value }))
                }
                placeholder="Утас-2"
                className="flex-1 px-3 bg-white text-base font-medium font-manrope placeholder:text-text-secondary text-text-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Error */}
      {saveError && (
        <p className="text-accent-rose text-sm font-manrope mt-4">
          {saveError}
        </p>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-10">
        <button
          onClick={handleSave}
          disabled={loading || !hasChanges}
          className={`bg-[#020617] text-white font-normal text-base font-manrope leading-5 px-3 py-2.5 rounded-[4px] transition-colors duration-200 ${
            loading || !hasChanges
              ? "cursor-not-allowed bg-[rgba(2,6,23,0.30)]"
              : "cursor-pointer hover:bg-[#1E293B]"
          }`}
        >
          {loading ? "Хадгалж байна..." : "Хадгалах"}
        </button>
      </div>
    </div>
  );
};
