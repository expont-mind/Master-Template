"use client";

import { useState, useEffect, useRef } from "react";

import { ContactPhoneField, ContactTextField } from "./_ContactFormFields";

interface ContactFormProps {
  lastName: string;
  firstName: string;
  phone1: string;
  phone2: string;
  addressSaved?: boolean;
  onLastNameChange: (value: string) => void;
  onFirstNameChange: (value: string) => void;
  onPhone1Change: (value: string) => void;
  onPhone2Change: (value: string) => void;
}

interface FieldErrors {
  lastName?: string;
  firstName?: string;
  phone1?: string;
  phone2?: string;
}

function validatePhone(value: string): string | undefined {
  if (!value.trim()) return "Утасны дугаар оруулна уу";
  if (!/^\d{8}$/.test(value.replace(/\D/g, ""))) return "8 оронтой дугаар оруулна уу";
  return undefined;
}

function computeErrors(args: {
  touched: Record<string, boolean>;
  lastName: string;
  firstName: string;
  phone1: string;
  phone2: string;
}): FieldErrors {
  const { touched, lastName, firstName, phone1, phone2 } = args;
  const errors: FieldErrors = {};
  if (touched.lastName && !lastName.trim()) errors.lastName = "Овог оруулна уу";
  if (touched.firstName && !firstName.trim()) errors.firstName = "Нэр оруулна уу";
  if (touched.phone1) errors.phone1 = validatePhone(phone1);
  if (touched.phone2 && phone2.trim()) errors.phone2 = validatePhone(phone2);
  return errors;
}

function useAddressSavedAnimation(addressSaved?: boolean) {
  const [isAnimating, setIsAnimating] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 200);
    return () => clearTimeout(timer);
  }, [addressSaved]);

  return isAnimating;
}

export function ContactForm({
  lastName,
  firstName,
  phone1,
  phone2,
  addressSaved,
  onLastNameChange,
  onFirstNameChange,
  onPhone1Change,
  onPhone2Change,
}: ContactFormProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const isAnimating = useAddressSavedAnimation(addressSaved);

  const errors = computeErrors({ touched, lastName, firstName, phone1, phone2 });

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  return (
    <div
      className={`flex flex-col gap-4 py-4 md:py-0 transition-all duration-200 ease-out ${
        isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      }`}
    >
      <p className="text-text-primary font-medium text-base md:text-xl font-manrope">
        Холбоо барих
      </p>

      <div className="flex flex-col gap-4">
        {/* Last Name & First Name */}
        <div className="flex flex-col sm:flex-row gap-4">
          <ContactTextField
            id="checkout-lastName"
            label="Овог"
            required
            value={lastName}
            onChange={onLastNameChange}
            onBlur={() => handleBlur("lastName")}
            placeholder="Овог"
            error={errors.lastName}
          />
          <ContactTextField
            id="checkout-firstName"
            label="Нэр"
            required
            value={firstName}
            onChange={onFirstNameChange}
            onBlur={() => handleBlur("firstName")}
            placeholder="Нэр"
            error={errors.firstName}
          />
        </div>

        {/* Phone 1 & Phone 2 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <ContactPhoneField
            id="checkout-phone1"
            label="Утас - 1"
            required
            value={phone1}
            onChange={onPhone1Change}
            onBlur={() => handleBlur("phone1")}
            placeholder="Утас-1"
            error={errors.phone1}
          />
          <ContactPhoneField
            id="checkout-phone2"
            label="Утас - 2"
            required
            value={phone2}
            onChange={onPhone2Change}
            onBlur={() => handleBlur("phone2")}
            placeholder="Утас-2"
            error={errors.phone2}
            showError={false}
          />
        </div>
      </div>
    </div>
  );
}
