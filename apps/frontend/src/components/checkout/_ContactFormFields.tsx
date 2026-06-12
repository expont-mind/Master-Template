"use client";

import { LOCALE } from "@/lib/utils/brand-config";

// Private sub-components for ContactForm. Each owns its own JSX + error
// styling but takes the value + onChange + onBlur from the parent so the
// `touched` state lives in one place.

const INPUT_BASE =
  "w-full h-12 pl-3 pr-0.5 bg-white border rounded-sm text-base font-manrope placeholder:text-text-secondary text-text-primary focus:outline-none transition-colors duration-200";
const INPUT_NORMAL_BORDER = "border-border focus:border-text-primary";
const INPUT_ERROR_BORDER = "border-brand-primary focus:border-brand-primary";

interface TextFieldProps {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder: string;
  error?: string;
}

export function ContactTextField({
  id,
  label,
  required,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
}: TextFieldProps) {
  return (
    <div className="flex-1 flex flex-col gap-0.5">
      <label htmlFor={id} className="text-text-primary font-normal text-sm font-manrope">
        {label}
        {required && <span className="text-brand-primary text-base">*</span>}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${INPUT_BASE} ${error ? INPUT_ERROR_BORDER : INPUT_NORMAL_BORDER}`}
      />
      {error && (
        <p id={`${id}-error`} className="text-brand-primary text-xs font-manrope mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
}

interface PhoneFieldProps {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder: string;
  error?: string;
  showError?: boolean;
}

export function ContactPhoneField({
  id,
  label,
  required,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  showError = true,
}: PhoneFieldProps) {
  const wrapperBorder = error
    ? INPUT_ERROR_BORDER
    : "border-border focus-within:border-text-primary transition-all duration-200";

  return (
    <div className="flex-1 flex flex-col gap-0.5">
      <label htmlFor={id} className="text-text-primary font-normal text-sm font-manrope">
        {label}
        {required && <span className="text-brand-primary text-base">*</span>}
      </label>
      <div className={`group flex h-12 border rounded-sm overflow-hidden ${wrapperBorder}`}>
        <div className="flex items-center px-3 border-r border-border group-focus-within:border-text-primary transition-colors duration-200">
          <span className="text-text-secondary font-medium text-base font-manrope whitespace-nowrap">
            +{LOCALE.phoneCountryCode}
          </span>
        </div>
        <input
          id={id}
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="flex-1 px-3 bg-white text-base font-medium font-manrope placeholder:text-text-secondary text-text-primary focus:outline-none"
        />
      </div>
      {showError && error && (
        <p id={`${id}-error`} className="text-brand-primary text-xs font-manrope mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
}
