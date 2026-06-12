"use client";

// Delivery address form. Either a "saved" read-only view (with edit
// button) or an editable form with 3 select-modal fields + free-text
// detail. Errors light up on first blur per field. Field UI lives in
// _DeliveryAddressFields.

import { useEffect, useState } from "react";

import {
  CITY_OPTIONS,
  DISTRICT_OPTIONS,
  KHOROO_OPTIONS,
  type ModalField,
} from "@/components/checkout/constants";
import { SavedAddressCard } from "@/components/checkout/SavedAddressCard";

import {
  AddressNameField,
  DefaultAddressCheckbox,
  DetailedAddressField,
  SelectField,
} from "./_DeliveryAddressFields";

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
  city?: string;
  district?: string;
  khoroo?: string;
  address?: string;
}

function computeErrors(
  city: string,
  district: string,
  khoroo: string,
  address: string,
  touched: Record<string, boolean>,
): FieldErrors {
  const errors: FieldErrors = {};
  if (touched.city && !city) errors.city = "Хот/Аймаг сонгоно уу";
  if (touched.district && !district) errors.district = "Дүүрэг/Сум сонгоно уу";
  if (touched.khoroo && !khoroo) errors.khoroo = "Хороо/Баг сонгоно уу";
  if (touched.address && !address.trim()) {
    errors.address = "Дэлгэрэнгүй хаяг оруулна уу";
  }
  return errors;
}

function lookupLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string,
): string {
  return options.find((o) => o.value === value)?.label || value;
}

function SavedAddressView({
  addressName,
  city,
  district,
  khoroo,
  address,
  isDefault,
  isAnimating,
  onEdit,
}: Pick<
  DeliveryAddressFormProps,
  "addressName" | "city" | "district" | "khoroo" | "address" | "isDefault" | "onEdit"
> & { isAnimating: boolean }) {
  return (
    <div
      className={`flex flex-col gap-4 py-4 md:py-0 transition-all duration-200 ease-out ${
        isAnimating ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
      }`}
    >
      <p className="text-text-primary font-medium text-base md:text-xl font-manrope">Хүргэх хаяг</p>
      <SavedAddressCard
        addressName={addressName}
        cityLabel={lookupLabel(CITY_OPTIONS, city)}
        districtLabel={lookupLabel(DISTRICT_OPTIONS, district)}
        khorooLabel={lookupLabel(KHOROO_OPTIONS, khoroo)}
        detail={address}
        isDefault={isDefault}
        onEdit={onEdit}
      />
    </div>
  );
}

export function DeliveryAddressForm(props: DeliveryAddressFormProps) {
  const {
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
  } = props;

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSavedView, setShowSavedView] = useState(addressSaved);

  useEffect(() => {
    if (addressSaved !== showSavedView) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setShowSavedView(addressSaved);
        setIsAnimating(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [addressSaved, showSavedView]);

  if (showSavedView) {
    return (
      <SavedAddressView
        addressName={addressName}
        city={city}
        district={district}
        khoroo={khoroo}
        address={address}
        isDefault={isDefault}
        isAnimating={isAnimating}
        onEdit={onEdit}
      />
    );
  }

  const errors = computeErrors(city, district, khoroo, address, touched);
  const handleBlur = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));
  const canSave = city && district && khoroo && address.trim();

  return (
    <div className="flex flex-col gap-4 py-4 md:py-0">
      <p className="text-text-primary font-medium text-base md:text-xl font-manrope">Хүргэх хаяг</p>

      <div
        className={`flex flex-col gap-4 transition-all duration-200 ease-out ${
          isAnimating ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        <div className="flex flex-col gap-4">
          <AddressNameField value={addressName} onChange={onAddressNameChange} />

          <SelectField
            id="delivery-city"
            label="Хот / Аймаг"
            value={city}
            displayLabel={lookupLabel(CITY_OPTIONS, city)}
            required
            error={errors.city}
            onOpen={() => {
              onOpenModal("city");
              handleBlur("city");
            }}
          />

          <SelectField
            id="delivery-district"
            label="Дүүрэг / Сум"
            value={district}
            displayLabel={lookupLabel(DISTRICT_OPTIONS, district)}
            required
            error={errors.district}
            onOpen={() => {
              onOpenModal("district");
              handleBlur("district");
            }}
          />

          <SelectField
            id="delivery-khoroo"
            label="Хороо / Баг"
            value={khoroo}
            displayLabel={lookupLabel(KHOROO_OPTIONS, khoroo)}
            required
            error={errors.khoroo}
            onOpen={() => {
              onOpenModal("khoroo");
              handleBlur("khoroo");
            }}
          />

          <DetailedAddressField
            value={address}
            onChange={onAddressChange}
            onBlur={() => handleBlur("address")}
            error={errors.address}
          />
        </div>

        <DefaultAddressCheckbox isDefault={isDefault} onChange={onIsDefaultChange} />

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
