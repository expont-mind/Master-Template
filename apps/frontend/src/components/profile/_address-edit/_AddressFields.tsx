"use client";

import {
  CITY_OPTIONS,
  DISTRICT_OPTIONS,
  KHOROO_OPTIONS,
  type ModalField,
} from "@/components/checkout/constants";
import { ChevronDownCategory } from "@/components/svg";

import { type AddressFormState } from "./_useAddressForm";

const selectButtonClass =
  "w-full h-12 pl-3 pr-0.5 bg-white border border-border rounded-sm text-base font-manrope text-left cursor-pointer focus:outline-none focus:border-text-primary transition-colors duration-200 flex items-center gap-2";

function getLabel(options: { value: string; label: string }[], value: string) {
  return options.find((o) => o.value === value)?.label || value;
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-text-primary font-normal text-sm font-manrope">
      {children}
      <span className="text-brand-primary text-base">*</span>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onClick,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <RequiredLabel>{label}</RequiredLabel>
      <button type="button" onClick={onClick} className={selectButtonClass}>
        <span className={`w-full py-2 ${value ? "text-text-primary" : "text-text-secondary"}`}>
          {getLabel(options, value) || "Сонгох"}
        </span>
        <div className="p-1.5">
          <ChevronDownCategory />
        </div>
      </button>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M2.5 6L5 8.5L9.5 4"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DefaultCheckbox({ isDefault, onToggle }: { isDefault: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={onToggle}
        role="checkbox"
        aria-checked={isDefault}
        aria-label="Үндсэн хаяг болгох"
        className={`w-4 h-4 rounded-[6px] shadow-[0_1px_2px_0_rgba(0,0,0,0.10)] p-0.5 flex items-center justify-center cursor-pointer transition-colors duration-200 ${
          isDefault ? "bg-text-primary border-text-primary" : "bg-white border-border-strong"
        }`}
      >
        {isDefault && <CheckIcon />}
      </button>
      <div className="flex flex-col gap-1.5">
        <p className="text-text-primary font-normal text-sm font-manrope">Үндсэн хаяг</p>
        <p className="text-text-secondary font-normal text-sm font-manrope">
          Дараагийн захиалгад автоматаар сонгогдоно
        </p>
      </div>
    </div>
  );
}

interface AddressFieldsProps {
  form: AddressFormState;
  onOpenModal: (field: ModalField) => void;
}

export function AddressFields({ form, onOpenModal }: AddressFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-0.5">
        <RequiredLabel>Хаягийн нэр</RequiredLabel>
        <input
          type="text"
          value={form.name}
          onChange={(e) => form.setName(e.target.value)}
          placeholder="Гэр, Ажил гэх мэт"
          className="w-full h-12 pl-3 pr-0.5 bg-white border border-border placeholder:text-text-secondary text-text-primary rounded-sm text-base font-manrope text-left focus:outline-none focus:border-text-primary transition-colors duration-200"
        />
      </div>

      <SelectField
        label="Хот / Аймаг"
        value={form.city}
        options={CITY_OPTIONS}
        onClick={() => onOpenModal("city")}
      />
      <SelectField
        label="Дүүрэг / Сум"
        value={form.district}
        options={DISTRICT_OPTIONS}
        onClick={() => onOpenModal("district")}
      />
      <SelectField
        label="Хороо / Баг"
        value={form.khoroo}
        options={KHOROO_OPTIONS}
        onClick={() => onOpenModal("khoroo")}
      />

      <div className="flex flex-col gap-0.5">
        <RequiredLabel>Дэлгэрэнгүй хаяг</RequiredLabel>
        <input
          type="text"
          value={form.detail}
          onChange={(e) => form.setDetail(e.target.value)}
          placeholder="Гудамж, байр, тоот... гэх мэт"
          className="w-full h-12 pl-3 pr-0.5 bg-white border border-border placeholder:text-text-secondary text-text-primary rounded-sm text-base font-manrope text-left focus:outline-none focus:border-text-primary transition-colors duration-200"
        />
      </div>

      <DefaultCheckbox
        isDefault={form.isDefault}
        onToggle={() => form.setIsDefault(!form.isDefault)}
      />
    </>
  );
}
