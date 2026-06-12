"use client";

// Phone verification modal — captures phone number + 6-digit OTP and
// either updates the auth user's phone (default) or invokes caller-
// supplied verify/resend callbacks. State + Supabase calls live in
// usePhoneVerification; this file is the presentational shell.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Cancel } from "@/components/svg";
import { PrimaryHeading } from "@/components/ui/typography";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { LOCALE } from "@/lib/utils/brand-config";

import { usePhoneVerification } from "./_usePhoneVerification";

interface PhoneVerificationModalProps {
  isOpen: boolean;
  phone?: string;
  onClose: () => void;
  onVerified: () => Promise<void>;
  verifyOtp?: (code: string) => Promise<{ error?: string }>;
  resendOtp?: () => Promise<{ error?: string }>;
  /** What the OTP was sent to — affects only the confirmation copy.
   *  Defaults to "phone" (point activation, phone change). */
  channel?: "phone" | "email";
}

function PhoneInputStep({
  phoneInput,
  setPhoneInput,
  loading,
  error,
  setError,
  onSubmit,
}: {
  phoneInput: string;
  setPhoneInput: (v: string) => void;
  loading: boolean;
  error: string;
  setError: (e: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-0.5">
        <label
          htmlFor="phone-verification-input"
          className="text-text-primary font-normal text-sm font-manrope"
        >
          Утас
        </label>
        <div className="h-12 flex items-center border border-border rounded-sm overflow-hidden focus-within:border-text-primary transition-colors group">
          <span className="px-3 text-text-secondary h-full flex items-center text-base font-medium font-manrope select-none border-r border-border group-focus-within:border-r-text-primary transition-colors">
            +{LOCALE.phoneCountryCode}
          </span>
          <input
            id="phone-verification-input"
            type="tel"
            inputMode="numeric"
            placeholder="99123456"
            value={phoneInput}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 8);
              setPhoneInput(val);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit();
            }}
            className="flex-1 px-3 py-3 outline-none text-text-primary text-sm font-normal font-manrope placeholder:text-text-secondary"
          />
        </div>
        {error && <p className="text-brand-primary font-normal text-sm font-manrope">{error}</p>}
      </div>

      <button
        onClick={onSubmit}
        disabled={loading}
        className={`w-full py-2.5 px-3 h-11 rounded-sm text-white font-normal text-base font-manrope transition-colors duration-200 ${
          phoneInput.length >= 8
            ? "bg-text-primary cursor-pointer hover:bg-surface-dark"
            : "bg-text-primary/30 cursor-not-allowed"
        }`}
      >
        {loading ? "Илгээж байна..." : "Идэвхжүүлэх"}
      </button>
    </div>
  );
}

const OTP_SLOT_IDS = ["a", "b", "c", "d", "e", "f"] as const;

function OtpStep({
  phone,
  channel = "phone",
  otp,
  otpRefs,
  error,
  loading,
  countdown,
  onOtpChange,
  onOtpKeyDown,
  onOtpPaste,
  onResend,
}: {
  phone: string;
  channel?: "phone" | "email";
  otp: string[];
  otpRefs: React.RefObject<(HTMLInputElement | null)[]>;
  error: string;
  loading: boolean;
  countdown: number;
  onOtpChange: (index: number, value: string) => void;
  onOtpKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onOtpPaste: (e: React.ClipboardEvent) => void;
  onResend: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-text-primary font-normal text-sm font-manrope leading-6">
        Таны <span className="font-semibold">{phone}</span>{" "}
        {channel === "email" ? "хаягт" : "дугаарт"} илгээсэн 6 оронтой баталгаажуулах кодыг оруулна
        уу.
      </p>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-center gap-3" onPaste={onOtpPaste}>
          {otp.map((digit, i) => (
            <input
              key={`otp-${OTP_SLOT_IDS[i]}`}
              ref={(el) => {
                otpRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              {...(i !== 0 && { maxLength: 1 })}
              value={digit}
              onChange={(e) => onOtpChange(i, e.target.value)}
              onKeyDown={(e) => onOtpKeyDown(i, e)}
              className="w-11 h-11 text-center text-lg font-semibold font-manrope text-text-primary border border-border rounded-[10px] outline-none focus:border-text-primary transition-colors"
            />
          ))}
        </div>
        {error && (
          <p className="text-brand-primary font-normal text-sm font-manrope text-center">{error}</p>
        )}
      </div>
      <div className="flex flex-col py-10">
        {loading && (
          <p className="text-text-secondary font-normal text-sm font-manrope text-center">
            Шалгаж байна...
          </p>
        )}
        {!loading && countdown > 0 && (
          <p className="text-text-secondary font-normal text-sm font-manrope text-center">
            Код хүчинтэй: {countdown}с
          </p>
        )}
        {!loading && countdown === 0 && (
          <div className="flex items-center justify-center">
            <button
              onClick={onResend}
              disabled={loading}
              className="text-text-primary font-medium text-sm font-manrope underline underline-offset-4 cursor-pointer hover:text-text-secondary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Дахин илгээх
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const PhoneVerificationModal = ({
  isOpen,
  phone: phoneProp,
  onClose,
  onVerified,
  verifyOtp: customVerifyOtp,
  resendOtp: customResendOtp,
  channel = "phone",
}: PhoneVerificationModalProps) => {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  const v = usePhoneVerification({
    isOpen,
    phoneProp,
    onVerified,
    customVerifyOtp,
    customResendOtp,
  });

  useScrollLock(visible);

  useEffect(() => {
    if (isOpen) {
      // Intentional sync: visible must mount before the next RAFs schedule the entry animation.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true));
      });
    } else {
      setAnimate(false);
      const timeout = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (visible) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [visible, onClose]);

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-overlay transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-[375px] bg-white border border-border rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-all duration-200 mx-4"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {v.step === "otp" && !phoneProp && (
              <button
                onClick={v.handleBackToPhoneStep}
                className="pr-1.5 py-1 cursor-pointer"
                aria-label="Буцах"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M15 6C15 6 9.00001 10.4189 9 12.0001C8.99999 13.5812 15 18 15 18"
                    stroke="#020617"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            <PrimaryHeading>{v.step === "phone" ? "Идэвхжүүлэх" : "Баталгаажуулах"}</PrimaryHeading>
          </div>
          <button onClick={onClose} className="p-1 cursor-pointer" aria-label="Хаах">
            <Cancel />
          </button>
        </div>

        <div className="flex flex-col gap-[22px] pb-1.5">
          {v.step === "phone" ? (
            <PhoneInputStep
              phoneInput={v.phoneInput}
              setPhoneInput={v.setPhoneInput}
              loading={v.loading}
              error={v.error}
              setError={v.setError}
              onSubmit={v.handleSendOtp}
            />
          ) : (
            <OtpStep
              phone={v.phone}
              channel={channel}
              otp={v.otp}
              otpRefs={v.otpRefs}
              error={v.error}
              loading={v.loading}
              countdown={v.countdown}
              onOtpChange={v.handleOtpChange}
              onOtpKeyDown={v.handleOtpKeyDown}
              onOtpPaste={v.handleOtpPaste}
              onResend={v.handleResendOtp}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
