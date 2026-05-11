"use client";

import { useState, useEffect } from "react";
import { ChevronDownCategory } from "@/components/svg";
import { SavedAddressCard } from "@/components/checkout/SavedAddressCard";
import {
  CITY_OPTIONS,
  DISTRICT_OPTIONS,
  KHOROO_OPTIONS,
  type ModalField,
} from "@/components/checkout/constants";

interface DeliveryAddressFormProps {
  addressName: string;
  city: string;
  district: string;
  khoroo: string;
  address: string;
  isDefault: boolean;
  addressSaved: boolean;
  onAddressNameChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onIsDefaultChange: (value: boolean) => void;
  onOpenModal: (field: ModalField) => void;
  onSave: () => void;
  onEdit: () => void;
}

interface FieldErrors {
  addressName?: string;
  city?: string;
  district?: string;
  khoroo?: string;
  address?: string;
}

export function DeliveryAddressForm({
  addressName,
  city,
  district,
  khoroo,
  address,
  isDefault,
  addressSaved,
  onAddressNameChange,
  onAddressChange,
  onIsDefaultChange,
  onOpenModal,
  onSave,
  onEdit,
}: DeliveryAddressFormProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSavedView, setShowSavedView] = useState(addressSaved);

  useEffect(() => {
    if (addressSaved !== showSavedView) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setShowSavedView(addressSaved);
        setIsAnimating(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [addressSaved, showSavedView]);

  const getCityLabel = () =>
    CITY_OPTIONS.find((o) => o.value === city)?.label || city;
  const getDistrictLabel = () =>
    DISTRICT_OPTIONS.find((o) => o.value === district)?.label || district;
  const getKhorooLabel = () =>
    KHOROO_OPTIONS.find((o) => o.value === khoroo)?.label || khoroo;

  if (showSavedView) {
    return (
      <div
        className={`flex flex-col gap-4 py-4 md:py-0 transition-all duration-200 ease-out ${
          isAnimating ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        <p className="text-text-primary font-medium text-base md:text-xl font-manrope">
          Хүргэх хаяг
        </p>
        <SavedAddressCard
          addressName={addressName}
          cityLabel={getCityLabel()}
          districtLabel={getDistrictLabel()}
          khorooLabel={getKhorooLabel()}
          detail={address}
          isDefault={isDefault}
          onEdit={onEdit}
        />
      </div>
    );
  }

  const errors: FieldErrors = {};
  if (touched.city && !city) errors.city = "Хот/Аймаг сонгоно уу";
  if (touched.district && !district) errors.district = "Дүүрэг/Сум сонгоно уу";
  if (touched.khoroo && !khoroo) errors.khoroo = "Хороо/Баг сонгоно уу";
  if (touched.address && !address.trim())
    errors.address = "Дэлгэрэнгүй хаяг оруулна уу";

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const canSave = city && district && khoroo && address.trim();

  const selectButtonClass = (hasError: boolean) =>
    `w-full h-12 pl-3 pr-0.5 bg-white border ${hasError ? "border-[var(--color-accent-rose)]" : "border-[var(--color-border)]"} rounded-sm text-base font-manrope text-left cursor-pointer focus:outline-none focus:border-[var(--color-text-primary)] transition-colors duration-200 flex items-center gap-2`;

  return (
    <div className="flex flex-col gap-4 py-4 md:py-0">
      <p className="text-text-primary font-medium text-base md:text-xl font-manrope">
        Хүргэх хаяг
      </p>

      <div
        className={`flex flex-col gap-4 transition-all duration-200 ease-out ${
          isAnimating ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        <div className="flex flex-col gap-4">
          {/* Address Name */}
          <div className="flex flex-col gap-0.5">
            <label
              htmlFor="delivery-address-name"
              className="text-text-primary font-normal text-sm font-manrope"
            >
              Хаягийн нэр
            </label>
            <input
              id="delivery-address-name"
              type="text"
              value={addressName}
              onChange={(e) => onAddressNameChange(e.target.value)}
              placeholder="Гэр, Ажил гэх мэт"
              className="w-full h-12 pl-3 pr-0.5 bg-white border border-border placeholder:text-text-secondary text-text-primary rounded-sm text-base font-manrope text-left focus:outline-none focus:border-text-primary transition-colors duration-200"
            />
          </div>

          {/* City / Aimag */}
          <div className="flex flex-col gap-0.5">
            <label
              id="delivery-city-label"
              className="text-text-primary font-normal text-sm font-manrope"
            >
              Хот / Аймаг
              <span className="text-accent-rose text-base">*</span>
            </label>
            <button
              onClick={() => {
                onOpenModal("city");
                handleBlur("city");
              }}
              className={selectButtonClass(!!errors.city)}
              aria-labelledby="delivery-city-label"
              aria-invalid={!!errors.city}
            >
              <span
                className={`w-full py-2 ${city ? "text-text-primary" : "text-text-secondary"}`}
              >
                {getCityLabel() || "Сонгох"}
              </span>
              <div className="p-1.5">
                <ChevronDownCategory />
              </div>
            </button>
            {errors.city && (
              <p className="text-accent-rose text-xs font-manrope mt-0.5">
                {errors.city}
              </p>
            )}
          </div>

          {/* District / Sum */}
          <div className="flex flex-col gap-0.5">
            <label
              id="delivery-district-label"
              className="text-text-primary font-normal text-sm font-manrope"
            >
              Дүүрэг / Сум
              <span className="text-accent-rose text-base">*</span>
            </label>
            <button
              onClick={() => {
                onOpenModal("district");
                handleBlur("district");
              }}
              className={selectButtonClass(!!errors.district)}
              aria-labelledby="delivery-district-label"
              aria-invalid={!!errors.district}
            >
              <span
                className={`w-full py-2 ${district ? "text-text-primary" : "text-text-secondary"}`}
              >
                {getDistrictLabel() || "Сонгох"}
              </span>
              <div className="p-1.5">
                <ChevronDownCategory />
              </div>
            </button>
            {errors.district && (
              <p className="text-accent-rose text-xs font-manrope mt-0.5">
                {errors.district}
              </p>
            )}
          </div>

          {/* Khoroo / Bag */}
          <div className="flex flex-col gap-0.5">
            <label
              id="delivery-khoroo-label"
              className="text-text-primary font-normal text-sm font-manrope"
            >
              Хороо / Баг
              <span className="text-accent-rose text-base">*</span>
            </label>
            <button
              onClick={() => {
                onOpenModal("khoroo");
                handleBlur("khoroo");
              }}
              className={selectButtonClass(!!errors.khoroo)}
              aria-labelledby="delivery-khoroo-label"
              aria-invalid={!!errors.khoroo}
            >
              <span
                className={`w-full py-2 ${khoroo ? "text-text-primary" : "text-text-secondary"}`}
              >
                {getKhorooLabel() || "Сонгох"}
              </span>
              <div className="p-1.5">
                <ChevronDownCategory />
              </div>
            </button>
            {errors.khoroo && (
              <p className="text-accent-rose text-xs font-manrope mt-0.5">
                {errors.khoroo}
              </p>
            )}
          </div>

          {/* Detailed Address */}
          <div className="flex flex-col gap-0.5">
            <label
              htmlFor="delivery-address"
              className="text-text-primary font-normal text-sm font-manrope"
            >
              Дэлгэрэнгүй хаяг
              <span className="text-accent-rose text-base">*</span>
            </label>
            <input
              id="delivery-address"
              type="text"
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
              onBlur={() => handleBlur("address")}
              placeholder="Гудамж, байр, тоот... гэх мэт"
              aria-invalid={!!errors.address}
              aria-describedby={
                errors.address ? "delivery-address-error" : undefined
              }
              className={`w-full h-12 pl-3 pr-0.5 bg-white border ${errors.address ? "border-accent-rose" : "border-border"} placeholder:text-text-secondary text-text-primary rounded-sm text-base font-manrope text-left focus:outline-none focus:border-text-primary transition-colors duration-200`}
            />
            {errors.address && (
              <p
                id="delivery-address-error"
                className="text-accent-rose text-xs font-manrope mt-0.5"
              >
                {errors.address}
              </p>
            )}
          </div>
        </div>

        {/* Default Address Checkbox */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => onIsDefaultChange(!isDefault)}
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

        {/* Save Address Button */}
        <button
          onClick={onSave}
          disabled={!canSave}
          className={`w-fit mt-4 px-3 py-2.5 rounded-sm font-medium text-base font-manrope transition-colors duration-200 ${
            canSave
              ? "bg-text-primary text-white cursor-pointer hover:bg-surface-dark"
              : "bg-overlay text-white cursor-not-allowed"
          }`}
        >
          <span className="px-0.5">Хаяг хадгалах</span>
        </button>
      </div>
    </div>
  );
}
