"use client";

import { useState, useEffect } from "react";
import { ChevronDownCategory, Slash } from "@/components/svg";
import { AddressMultiStepModal } from "@/components/checkout/AddressMultiStepModal";
import Link from "next/link";
import {
  CITY_OPTIONS,
  DISTRICT_OPTIONS,
  KHOROO_OPTIONS,
  type ModalField,
} from "@/components/checkout/constants";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

interface AddressEditContentProps {
  addressId?: string;
  existingAddress?: AddressRow;
  onBack: () => void;
  onSave: () => void;
}

export const AddressEditContent = ({
  addressId,
  existingAddress,
  onBack,
  onSave,
}: AddressEditContentProps) => {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [khoroo, setKhoroo] = useState("");
  const [detail, setDetail] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [openModal, setOpenModal] = useState<ModalField>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingAddress) {
      setName(existingAddress.name || "");
      setCity(existingAddress.city || "");
      setDistrict(existingAddress.district || "");
      setKhoroo(existingAddress.sub_district || "");
      setDetail(existingAddress.detail || "");
      setIsDefault(existingAddress.is_default);
    }
  }, [existingAddress]);

  const getLabel = (
    options: { value: string; label: string }[],
    value: string,
  ) => options.find((o) => o.value === value)?.label || value;

  const selectButtonClass =
    "w-full h-12 pl-3 pr-0.5 bg-white border border-border rounded-sm text-base font-manrope text-left cursor-pointer focus:outline-none focus:border-text-primary transition-colors duration-200 flex items-center gap-2";

  const canSave = city && district && khoroo && detail.trim();

  const hasChanges = existingAddress
    ? name !== (existingAddress.name || "") ||
      city !== (existingAddress.city || "") ||
      district !== (existingAddress.district || "") ||
      khoroo !== (existingAddress.sub_district || "") ||
      detail !== (existingAddress.detail || "") ||
      isDefault !== existingAddress.is_default
    : true;

  return (
    <div className="flex flex-col gap-4 md:gap-2">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 px-px md:px-0.5 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <div className="flex items-center gap-1.5 md:hidden">
            <Link
              href="/profile"
              className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
            >
              Профайл
            </Link>
            <Slash />
          </div>
          <Link
            href="/profile?tab=settings"
            className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
          >
            Тохиргоо
          </Link>
          <Slash />
          <Link
            href="/profile?tab=address"
            className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
          >
            Миний хаяг
          </Link>
          <Slash />
          <p className="text-slate-950 text-sm font-normal font-manrope">
            {addressId ? "Хаяг өөрчлөх" : "Хүргэх хаяг"}
          </p>
        </div>

        <p className="px-0 md:px-0.5 pb-0 md:pb-3 text-[#020617] font-bold md:font-semibold text-2xl md:text-xl font-manrope">
          {addressId ? "Хаяг өөрчлөх" : "Хүргэх хаяг"}
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4 px-0.5">
        {/* Name */}
        <div className="flex flex-col gap-0.5">
          <label className="text-text-primary font-normal text-sm font-manrope">
            Хаягийн нэр
            <span className="text-accent-rose text-base">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Гэр, Ажил гэх мэт"
            className="w-full h-12 pl-3 pr-0.5 bg-white border border-border placeholder:text-text-secondary text-text-primary rounded-sm text-base font-manrope text-left focus:outline-none focus:border-text-primary transition-colors duration-200"
          />
        </div>

        {/* City */}
        <div className="flex flex-col gap-0.5">
          <label className="text-text-primary font-normal text-sm font-manrope">
            Хот / Аймаг
            <span className="text-accent-rose text-base">*</span>
          </label>
          <button
            onClick={() => setOpenModal("city")}
            className={selectButtonClass}
          >
            <span
              className={`w-full py-2 ${city ? "text-text-primary" : "text-text-secondary"}`}
            >
              {getLabel(CITY_OPTIONS, city) || "Сонгох"}
            </span>
            <div className="p-1.5">
              <ChevronDownCategory />
            </div>
          </button>
        </div>

        {/* District */}
        <div className="flex flex-col gap-0.5">
          <label className="text-text-primary font-normal text-sm font-manrope">
            Дүүрэг / Сум
            <span className="text-accent-rose text-base">*</span>
          </label>
          <button
            onClick={() => setOpenModal("district")}
            className={selectButtonClass}
          >
            <span
              className={`w-full py-2 ${district ? "text-text-primary" : "text-text-secondary"}`}
            >
              {getLabel(DISTRICT_OPTIONS, district) || "Сонгох"}
            </span>
            <div className="p-1.5">
              <ChevronDownCategory />
            </div>
          </button>
        </div>

        {/* Khoroo */}
        <div className="flex flex-col gap-0.5">
          <label className="text-text-primary font-normal text-sm font-manrope">
            Хороо / Баг
            <span className="text-accent-rose text-base">*</span>
          </label>
          <button
            onClick={() => setOpenModal("khoroo")}
            className={selectButtonClass}
          >
            <span
              className={`w-full py-2 ${khoroo ? "text-text-primary" : "text-text-secondary"}`}
            >
              {getLabel(KHOROO_OPTIONS, khoroo) || "Сонгох"}
            </span>
            <div className="p-1.5">
              <ChevronDownCategory />
            </div>
          </button>
        </div>

        {/* Detail */}
        <div className="flex flex-col gap-0.5">
          <label className="text-text-primary font-normal text-sm font-manrope">
            Дэлгэрэнгүй хаяг
            <span className="text-accent-rose text-base">*</span>
          </label>
          <input
            type="text"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Гудамж, байр, тоот... гэх мэт"
            className="w-full h-12 pl-3 pr-0.5 bg-white border border-border placeholder:text-text-secondary text-text-primary rounded-sm text-base font-manrope text-left focus:outline-none focus:border-text-primary transition-colors duration-200"
          />
        </div>

        {/* Default Checkbox */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => setIsDefault(!isDefault)}
            role="checkbox"
            aria-checked={isDefault}
            aria-label="Үндсэн хаяг болгох"
            className={`w-4 h-4 rounded-[6px] shadow-[0_1px_2px_0_rgba(0,0,0,0.10)] p-0.5 flex items-center justify-center cursor-pointer transition-colors duration-200 ${
              isDefault
                ? "bg-text-primary border-text-primary"
                : "bg-white border-[#CBD5E1]"
            }`}
          >
            {isDefault && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2.5 6L5 8.5L9.5 4"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <div className="flex flex-col gap-1.5">
            <p className="text-text-primary font-normal text-sm font-manrope">
              Үндсэн хаяг
            </p>
            <p className="text-text-secondary font-normal text-sm font-manrope">
              Дараагийн захиалгад автоматаар сонгогдоно
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-[10px]">
          <button
            onClick={async () => {
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
                // Remove default from all other addresses
                await supabase
                  .from("addresses")
                  .update({ is_default: false })
                  .eq("user_id", user.id);
              }

              if (addressId) {
                // Update existing address
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
                // Insert new address
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
            }}
            disabled={!canSave || !hasChanges || saving}
            className={`w-fit px-3 py-2.5 rounded-sm font-medium text-base font-manrope transition-colors duration-200 ${
              canSave && hasChanges && !saving
                ? "bg-text-primary text-white cursor-pointer hover:bg-surface-dark"
                : "bg-overlay text-white cursor-not-allowed"
            }`}
          >
            <span className="px-0.5">
              {saving ? "Хадгалж байна..." : addressId ? "Өөрчлөх" : "Хадгалах"}
            </span>
          </button>
        </div>
      </div>

      {/* Address Multi-Step Modal */}
      <AddressMultiStepModal
        isOpen={openModal !== null}
        onClose={() => setOpenModal(null)}
        initialStep={openModal}
        city={city}
        setCity={setCity}
        district={district}
        setDistrict={setDistrict}
        khoroo={khoroo}
        setKhoroo={setKhoroo}
      />
    </div>
  );
};
