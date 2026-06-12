"use client";

import { SITE } from "@repo/config-site";
import Link from "next/link";
import { useState } from "react";

import { Slash } from "@/components/svg";
import { createClient } from "@/lib/supabase/client";
import { LOCALE } from "@/lib/utils/brand-config";
import { formatPhoneE164 } from "@/lib/utils/formatters";

import { PhoneVerifiedView } from "./_PhoneVerifiedView";
import { PhoneVerificationModal } from "./PhoneVerificationModal";

import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

interface PhoneContentProps {
  user: UserRow | null;
  onRefresh: () => Promise<void>;
}

// Wrapper/inner split: SMS phone verification only exists when the auth
// channel is phone — with email auth (no SMS provider) sending the OTP
// would always error, so the capture surface is hidden entirely.
export const PhoneContent = (props: PhoneContentProps) => {
  if (SITE.auth.method !== "phone") {
    return props.user?.primary_phone ? (
      <PhoneVerifiedView primaryPhone={props.user.primary_phone} />
    ) : null;
  }
  return <PhoneContentInner {...props} />;
};

const PhoneContentInner = ({ user, onRefresh }: PhoneContentProps) => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);

  if (user?.primary_phone) {
    return <PhoneVerifiedView primaryPhone={user.primary_phone} />;
  }

  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 8 || !/^[6-9]/.test(digits)) {
      setError("Зөв утасны дугаар оруулна уу (8 оронтой)");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.updateUser({
        phone: formatPhoneE164(digits),
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setShowOtpModal(true);
    } catch {
      setError("Код илгээхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="pb-2 md:pb-3 pt-5 md:pt-0">
        <div className="flex flex-col gap-0.5 px-0.5">
          <div className="flex items-center gap-1.5 md:hidden">
            <Link
              href="/profile"
              className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
            >
              Профайл
            </Link>
            <Slash />
            <p className="text-slate-950 text-sm font-normal font-manrope">Утас</p>
          </div>
          <p className="text-text-primary font-semibold text-xl font-manrope leading-7">
            Баталгаат утас
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-0.5">
        <div className="flex flex-col gap-0.5">
          <label
            htmlFor="phone-content-input"
            className="text-text-primary font-normal text-sm font-manrope"
          >
            Утас
          </label>
          <div className="flex flex-col gap-4 max-w-[400px]">
            <div className="h-12 flex items-center border border-border rounded-sm overflow-hidden focus-within:border-text-primary transition-colors group">
              <span className="px-3 text-text-secondary h-full flex items-center text-base font-medium font-manrope select-none border-r border-border group-focus-within:border-r-text-primary transition-colors">
                +{LOCALE.phoneCountryCode}
              </span>
              <input
                id="phone-content-input"
                type="tel"
                inputMode="numeric"
                placeholder="99123456"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                  setPhone(val);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendOtp();
                }}
                className="flex-1 px-3 py-3 outline-none text-text-primary text-sm font-normal font-manrope placeholder:text-text-secondary"
              />
            </div>
            {error && (
              <p className="text-brand-primary font-normal text-sm font-manrope">{error}</p>
            )}
            <button
              onClick={handleSendOtp}
              disabled={!phone || loading}
              className="w-full h-11 bg-text-primary text-white font-medium text-sm font-manrope rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-dark transition-colors"
            >
              {loading ? "Илгээж байна..." : "Код илгээх"}
            </button>
          </div>
        </div>
      </div>

      <PhoneVerificationModal
        isOpen={showOtpModal}
        phone={phone}
        onClose={() => setShowOtpModal(false)}
        onVerified={async () => {
          setShowOtpModal(false);
          await onRefresh();
        }}
      />
    </div>
  );
};
