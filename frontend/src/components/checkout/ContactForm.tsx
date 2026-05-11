"use client";

import { useState, useEffect, useRef } from "react";

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
  if (!/^\d{8}$/.test(value.replace(/\D/g, "")))
    return "8 оронтой дугаар оруулна уу";
  return undefined;
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

  const errors: FieldErrors = {};
  if (touched.lastName && !lastName.trim()) errors.lastName = "Овог оруулна уу";
  if (touched.firstName && !firstName.trim())
    errors.firstName = "Нэр оруулна уу";
  if (touched.phone1) errors.phone1 = validatePhone(phone1);
  if (touched.phone2 && phone2.trim()) errors.phone2 = validatePhone(phone2);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const inputBaseClass =
    "w-full h-12 pl-3 pr-0.5 bg-white border rounded-sm text-base font-manrope placeholder:text-text-secondary text-text-primary focus:outline-none transition-colors duration-200";
  const inputNormalBorder = "border-border focus:border-text-primary";
  const inputErrorBorder = "border-accent-rose focus:border-accent-rose";

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
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
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
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
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
                value={phone1}
                onChange={(e) => onPhone1Change(e.target.value)}
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
                value={phone2}
                onChange={(e) => onPhone2Change(e.target.value)}
                onBlur={() => handleBlur("phone2")}
                placeholder="Утас-2"
                aria-invalid={!!errors.phone2}
                aria-describedby={
                  errors.phone2 ? "checkout-phone2-error" : undefined
                }
                className="flex-1 px-3 bg-white text-base font-medium font-manrope placeholder:text-text-secondary text-text-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
