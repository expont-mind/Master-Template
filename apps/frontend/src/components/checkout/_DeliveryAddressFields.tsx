"use client";

// Field building blocks used by DeliveryAddressForm.

import { ChevronDownCategory } from "@/components/svg";

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  displayLabel: string;
  required: boolean;
  error: string | undefined;
  onOpen: () => void;
}

const SELECT_BUTTON_BASE =
  "w-full h-12 pl-3 pr-0.5 bg-white rounded-sm text-base font-manrope text-left cursor-pointer focus:outline-none focus:border-[var(--color-text-primary)] transition-colors duration-200 flex items-center gap-2";

export function SelectField({
  id,
  label,
  value,
  displayLabel,
  required,
  error,
  onOpen,
}: SelectFieldProps) {
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const buttonClass = `${SELECT_BUTTON_BASE} border ${
    error ? "border-[var(--color-brand-primary)]" : "border-[var(--color-border)]"
  }`;
  return (
    <div className="flex flex-col gap-0.5">
      <label id={labelId} className="text-text-primary font-normal text-sm font-manrope">
        {label}
        {required && <span className="text-brand-primary text-base">*</span>}
      </label>
      <button
        onClick={onOpen}
        className={buttonClass}
        aria-labelledby={labelId}
        aria-describedby={error ? errorId : undefined}
      >
        <span className={`w-full py-2 ${value ? "text-text-primary" : "text-text-secondary"}`}>
          {displayLabel || "Сонгох"}
        </span>
        <div className="p-1.5">
          <ChevronDownCategory />
        </div>
      </button>
      {error && (
        <p id={errorId} className="text-brand-primary text-xs font-manrope mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
}

interface AddressNameFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function AddressNameField({ value, onChange }: AddressNameFieldProps) {
  return (
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Гэр, Ажил гэх мэт"
        className="w-full h-12 pl-3 pr-0.5 bg-white border border-border placeholder:text-text-secondary text-text-primary rounded-sm text-base font-manrope text-left focus:outline-none focus:border-text-primary transition-colors duration-200"
      />
    </div>
  );
}

interface DetailedAddressFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error: string | undefined;
}

export function DetailedAddressField({
  value,
  onChange,
  onBlur,
  error,
}: DetailedAddressFieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <label
        htmlFor="delivery-address"
        className="text-text-primary font-normal text-sm font-manrope"
      >
        Дэлгэрэнгүй хаяг
        <span className="text-brand-primary text-base">*</span>
      </label>
      <input
        id="delivery-address"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Гудамж, байр, тоот... гэх мэт"
        aria-invalid={!!error}
        aria-describedby={error ? "delivery-address-error" : undefined}
        className={`w-full h-12 pl-3 pr-0.5 bg-white border ${
          error ? "border-brand-primary" : "border-border"
        } placeholder:text-text-secondary text-text-primary rounded-sm text-base font-manrope text-left focus:outline-none focus:border-text-primary transition-colors duration-200`}
      />
      {error && (
        <p id="delivery-address-error" className="text-brand-primary text-xs font-manrope mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
}

interface DefaultAddressCheckboxProps {
  isDefault: boolean;
  onChange: (value: boolean) => void;
}

export function DefaultAddressCheckbox({ isDefault, onChange }: DefaultAddressCheckboxProps) {
  return (
    <div className="flex items-start gap-3">
      <button
        onClick={() => onChange(!isDefault)}
        role="checkbox"
        aria-checked={isDefault}
        aria-label="Үндсэн хаяг болгох"
        className={`w-4 h-4 rounded-[6px] shadow-[0_1px_2px_0_rgba(0,0,0,0.10)] p-0.5 flex items-center justify-center cursor-pointer transition-colors duration-200 ${
          isDefault ? "bg-text-primary border-text-primary" : "bg-white border-border-strong"
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
        <p className="text-text-primary font-normal text-sm font-manrope">Үндсэн хаяг</p>
        <p className="text-text-secondary font-normal text-sm font-manrope">
          Дараагийн захиалгад автоматаар сонгогдоно
        </p>
      </div>
    </div>
  );
}
