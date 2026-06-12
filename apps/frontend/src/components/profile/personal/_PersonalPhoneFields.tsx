"use client";

import { LOCALE } from "@/lib/utils/brand-config";

import type { PersonalFieldErrors, PersonalFormData } from "./_usePersonalForm";

const INPUT_ERROR_BORDER = "border-brand-primary focus:border-brand-primary";

interface PersonalPhoneFieldsProps {
  formData: PersonalFormData;
  errors: PersonalFieldErrors;
  setField: (field: keyof PersonalFormData, value: string) => void;
  handleBlur: (field: string) => void;
}

export function PersonalPhoneFields({
  formData,
  errors,
  setField,
  handleBlur,
}: PersonalPhoneFieldsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 flex flex-col gap-0.5">
        <label
          htmlFor="checkout-phone1"
          className="text-text-primary font-normal text-sm font-manrope"
        >
          Утас - 1<span className="text-brand-primary text-base">*</span>
        </label>
        <div
          className={`group flex h-12 border rounded-sm overflow-hidden ${errors.phone1 ? INPUT_ERROR_BORDER : "border-border focus-within:border-text-primary transition-all duration-200"}`}
        >
          <div className="flex items-center px-3 border-r border-border group-focus-within:border-text-primary transition-colors duration-200">
            <span className="text-text-secondary font-medium text-base font-manrope whitespace-nowrap">
              +{LOCALE.phoneCountryCode}
            </span>
          </div>
          <input
            id="checkout-phone1"
            type="tel"
            value={formData.phone1}
            onChange={(e) => setField("phone1", e.target.value)}
            onBlur={() => handleBlur("phone1")}
            placeholder="Утас-1"
            aria-invalid={!!errors.phone1}
            aria-describedby={errors.phone1 ? "checkout-phone1-error" : undefined}
            className="flex-1 px-3 bg-white text-base font-medium font-manrope placeholder:text-text-secondary text-text-primary focus:outline-none"
          />
        </div>
        {errors.phone1 && (
          <p id="checkout-phone1-error" className="text-brand-primary text-xs font-manrope mt-0.5">
            {errors.phone1}
          </p>
        )}
      </div>
      <div className="flex-1 flex flex-col gap-0.5">
        <label
          htmlFor="checkout-phone2"
          className="text-text-primary font-normal text-sm font-manrope"
        >
          Утас - 2<span className="text-brand-primary text-base">*</span>
        </label>
        <div className="group flex h-12 border rounded-sm overflow-hidden border-border focus-within:border-text-primary transition-all duration-200">
          <div className="flex items-center px-3 border-r border-border group-focus-within:border-text-primary transition-colors duration-200">
            <span className="text-text-secondary font-medium text-base font-manrope whitespace-nowrap">
              +{LOCALE.phoneCountryCode}
            </span>
          </div>
          <input
            id="checkout-phone2"
            type="tel"
            value={formData.phone2}
            onChange={(e) => setField("phone2", e.target.value)}
            placeholder="Утас-2"
            className="flex-1 px-3 bg-white text-base font-medium font-manrope placeholder:text-text-secondary text-text-primary focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
