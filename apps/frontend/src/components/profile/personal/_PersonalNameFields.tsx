"use client";

import type { PersonalFieldErrors, PersonalFormData } from "./_usePersonalForm";

const INPUT_BASE_CLASS =
  "w-full h-12 pl-3 pr-0.5 bg-white border rounded-sm text-base font-manrope placeholder:text-text-secondary text-text-primary focus:outline-none transition-colors duration-200";
const INPUT_NORMAL_BORDER = "border-border focus:border-text-primary";
const INPUT_ERROR_BORDER = "border-brand-primary focus:border-brand-primary";

interface PersonalNameFieldsProps {
  formData: PersonalFormData;
  errors: PersonalFieldErrors;
  setField: (field: keyof PersonalFormData, value: string) => void;
  handleBlur: (field: string) => void;
}

export function PersonalNameFields({
  formData,
  errors,
  setField,
  handleBlur,
}: PersonalNameFieldsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 flex flex-col gap-0.5">
        <label
          htmlFor="checkout-lastName"
          className="text-text-primary font-normal text-sm font-manrope"
        >
          Овог
          <span className="text-brand-primary text-base">*</span>
        </label>
        <input
          id="checkout-lastName"
          type="text"
          value={formData.lastName}
          onChange={(e) => setField("lastName", e.target.value)}
          onBlur={() => handleBlur("lastName")}
          placeholder="Овог"
          aria-invalid={!!errors.lastName}
          aria-describedby={errors.lastName ? "checkout-lastName-error" : undefined}
          className={`${INPUT_BASE_CLASS} ${errors.lastName ? INPUT_ERROR_BORDER : INPUT_NORMAL_BORDER}`}
        />
        {errors.lastName && (
          <p
            id="checkout-lastName-error"
            className="text-brand-primary text-xs font-manrope mt-0.5"
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
          <span className="text-brand-primary text-base">*</span>
        </label>
        <input
          id="checkout-firstName"
          type="text"
          value={formData.firstName}
          onChange={(e) => setField("firstName", e.target.value)}
          onBlur={() => handleBlur("firstName")}
          placeholder="Нэр"
          aria-invalid={!!errors.firstName}
          aria-describedby={errors.firstName ? "checkout-firstName-error" : undefined}
          className={`${INPUT_BASE_CLASS} ${errors.firstName ? INPUT_ERROR_BORDER : INPUT_NORMAL_BORDER}`}
        />
        {errors.firstName && (
          <p
            id="checkout-firstName-error"
            className="text-brand-primary text-xs font-manrope mt-0.5"
          >
            {errors.firstName}
          </p>
        )}
      </div>
    </div>
  );
}
