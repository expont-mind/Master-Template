"use client";

import { SITE } from "@repo/config-site";

import { Cancel, Facebook, Google } from "@/components/svg";
import { LOCALE } from "@/lib/utils/brand-config";

import type { Provider } from "@supabase/supabase-js";

interface LoginPhoneStepProps {
  animate: boolean;
  phone: string;
  loading: boolean;
  error: string;
  onClose: () => void;
  onPhoneChange: (val: string) => void;
  onSendOtp: () => void;
  onSocialLogin: (provider: Provider) => void;
  onGuestLogin: () => void;
}

export function LoginPhoneStep({
  animate,
  phone,
  loading,
  error,
  onClose,
  onPhoneChange,
  onSendOtp,
  onSocialLogin,
  onGuestLogin,
}: LoginPhoneStepProps) {
  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-overlay transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[375px] bg-white border border-border rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-all duration-200"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <p
            id="login-modal-title"
            className="text-text-primary font-semibold text-xl font-manrope"
          >
            Нэвтрэх
          </p>
          <button onClick={onClose} className="p-1 cursor-pointer" aria-label="Хаах">
            <Cancel />
          </button>
        </div>

        <div className="flex flex-col gap-[22px]">
          {/* Description */}
          <p className="text-text-primary font-normal text-base font-manrope leading-6">
            Та нэвтрээд дуртай бүтээгдэхүүнээ хадгалж, захиалга өгөөрэй!
          </p>

          <div className="flex flex-col gap-4">
            {SITE.auth.method === "email" ? (
              <EmailEntrySection
                email={phone}
                loading={loading}
                error={error}
                onEmailChange={onPhoneChange}
                onSendOtp={onSendOtp}
              />
            ) : (
              <PhoneEntrySection
                phone={phone}
                loading={loading}
                error={error}
                onPhoneChange={onPhoneChange}
                onSendOtp={onSendOtp}
              />
            )}

            <DividerWithLabel label="Эсвэл" />

            <SocialLoginButtons onSocialLogin={onSocialLogin} />

            <DividerWithLabel label="Эсвэл" />

            <GuestLoginButton loading={loading} onClick={onGuestLogin} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface PhoneEntrySectionProps {
  phone: string;
  loading: boolean;
  error: string;
  onPhoneChange: (val: string) => void;
  onSendOtp: () => void;
}

function PhoneEntrySection({
  phone,
  loading,
  error,
  onPhoneChange,
  onSendOtp,
}: PhoneEntrySectionProps) {
  return (
    <div className="flex flex-col gap-[22px]">
      {/* Phone Input */}
      <div className="flex flex-col gap-0.5">
        <label
          htmlFor="login-phone-input"
          className="text-text-primary font-normal text-sm font-manrope"
        >
          Утас
        </label>
        <div className="h-12 flex items-center border border-border rounded-sm overflow-hidden focus-within:border-text-primary transition-colors group">
          <span className="px-3 text-text-secondary h-full flex items-center text-base font-medium font-manrope select-none border-r border-border group-focus-within:border-r-text-primary transition-colors">
            +{LOCALE.phoneCountryCode}
          </span>
          <input
            id="login-phone-input"
            type="tel"
            inputMode="numeric"
            placeholder="Энд оруулна уу"
            value={phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 8);
              onPhoneChange(val);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSendOtp();
            }}
            className="flex-1 px-3 py-3 outline-none text-text-primary text-sm font-normal font-manrope placeholder:text-text-secondary"
          />
        </div>
        {error && <p className="text-brand-primary font-normal text-sm font-manrope">{error}</p>}
      </div>

      {/* Continue Button */}
      <button
        onClick={onSendOtp}
        disabled={loading}
        className={`w-full py-2.5 px-3 rounded-sm text-white font-normal text-base font-manrope transition-colors duration-200 ${
          phone.length >= 8
            ? "bg-text-primary cursor-pointer hover:bg-surface-dark"
            : "bg-text-primary/30 cursor-not-allowed"
        }`}
      >
        {loading ? "Илгээж байна..." : "Үргэлжлүүлэх"}
      </button>
    </div>
  );
}

interface EmailEntrySectionProps {
  email: string;
  loading: boolean;
  error: string;
  onEmailChange: (val: string) => void;
  onSendOtp: () => void;
}

function EmailEntrySection({
  email,
  loading,
  error,
  onEmailChange,
  onSendOtp,
}: EmailEntrySectionProps) {
  return (
    <div className="flex flex-col gap-[22px]">
      {/* Email Input */}
      <div className="flex flex-col gap-0.5">
        <label
          htmlFor="login-email-input"
          className="text-text-primary font-normal text-sm font-manrope"
        >
          Имэйл
        </label>
        <div className="h-12 flex items-center border border-border rounded-sm overflow-hidden focus-within:border-text-primary transition-colors">
          <input
            id="login-email-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSendOtp();
            }}
            className="flex-1 px-3 py-3 outline-none text-text-primary text-sm font-normal font-manrope placeholder:text-text-secondary"
          />
        </div>
        {error && <p className="text-brand-primary font-normal text-sm font-manrope">{error}</p>}
      </div>

      {/* Continue Button */}
      <button
        onClick={onSendOtp}
        disabled={loading}
        className={`w-full py-2.5 px-3 rounded-sm text-white font-normal text-base font-manrope transition-colors duration-200 ${
          email.includes("@")
            ? "bg-text-primary cursor-pointer hover:bg-surface-dark"
            : "bg-text-primary/30 cursor-not-allowed"
        }`}
      >
        {loading ? "Илгээж байна..." : "Үргэлжлүүлэх"}
      </button>
    </div>
  );
}

function DividerWithLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-px bg-border" />
      <span className="text-text-secondary font-medium text-xs font-manrope">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

interface SocialLoginButtonsProps {
  onSocialLogin: (provider: Provider) => void;
}

function SocialLoginButtons({ onSocialLogin }: SocialLoginButtonsProps) {
  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => onSocialLogin("facebook")}
        className="relative w-full h-[50px] flex items-center gap-3 justify-center px-6 border border-border rounded-sm cursor-pointer hover:bg-surface transition-colors duration-200"
      >
        <Facebook />

        <span className="text-text-subtle font-normal text-base font-manrope flex-1">
          Facebook-р нэвтрэх
        </span>
      </button>

      <button
        onClick={() => onSocialLogin("google")}
        className="relative w-full h-[50px] flex items-center gap-3 justify-center px-6 border border-border rounded-sm cursor-pointer hover:bg-surface transition-colors duration-200"
      >
        <Google />

        <span className="text-text-subtle font-normal text-base font-manrope flex-1">
          Google-р нэвтрэх
        </span>
      </button>

      {/* <button
        onClick={() => onSocialLogin("apple")}
        className="relative w-full h-[50px] flex items-center gap-3 justify-center px-6 border border-border rounded-sm cursor-pointer hover:bg-surface transition-colors duration-200"
      >
        <Apple />

        <span className="text-text-subtle font-normal text-base font-manrope flex-1">
          Apple-р нэвтрэх
        </span>
      </button> */}
    </div>
  );
}

interface GuestLoginButtonProps {
  loading: boolean;
  onClick: () => void;
}

function GuestLoginButton({ loading, onClick }: GuestLoginButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full py-2.5 px-3 rounded-sm text-text-subtle font-normal text-base font-manrope border border-border cursor-pointer hover:bg-surface transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Уншиж байна..." : "Зочноор үргэлжлүүлэх"}
    </button>
  );
}
