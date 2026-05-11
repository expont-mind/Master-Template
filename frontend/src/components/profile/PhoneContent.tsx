"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { stripPhonePrefix } from "@/lib/utils/formatters";
import { Slash } from "../svg";
import Link from "next/link";
import { PhoneVerificationModal } from "./PhoneVerificationModal";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

interface PhoneContentProps {
  user: UserRow | null;
  onRefresh: () => Promise<void>;
}

export const PhoneContent = ({ user, onRefresh }: PhoneContentProps) => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const hasPhone = !!user?.primary_phone;

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
        phone: "+976" + digits,
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

  if (hasPhone) {
    return (
      <div className="flex flex-col gap-4 md:gap-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 px-px md:px-0.5">
            <div className="flex items-center gap-1.5 md:hidden">
              <Link
                href="/profile"
                className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
              >
                Профайл
              </Link>
              <Slash />
            </div>
            <Link
              href="/profile?tab=settings"
              className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
            >
              Тохиргоо
            </Link>
            <Slash />
            <p className="text-slate-950 text-sm font-normal font-manrope">
              Баталгаат утас
            </p>
          </div>

          <p className="px-0 md:px-0.5 pb-0 md:pb-3 text-[#020617] font-bold md:font-semibold text-2xl md:text-xl font-manrope">
            Баталгаат утас
          </p>
        </div>

        <div className="flex flex-col gap-4 px-0.5">
          <div className="flex items-center justify-between py-4 border-b border-[#E2E8F0]">
            <div className="flex flex-col gap-1">
              <p className="text-[#020617] font-medium text-sm font-manrope leading-5">
                Утасны дугаар
              </p>
              <p className="text-[#64748B] font-normal text-sm font-manrope leading-5">
                {stripPhonePrefix(user.primary_phone!)}
              </p>
            </div>
            <span className="bg-[#F0FDFA] text-[#14B8A6] font-medium text-sm font-manrope leading-5 px-2 py-0.5 rounded-[4px]">
              Баталгаажсан
            </span>
          </div>
        </div>
      </div>
    );
  }

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
            <p className="text-slate-950 text-sm font-normal font-manrope">
              Утас
            </p>
          </div>
          <p className="text-[#020617] font-semibold text-xl font-manrope leading-7">
            Баталгаат утас
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-0.5">
        <div className="flex flex-col gap-0.5">
          <label className="text-[#020617] font-normal text-sm font-manrope">
            Утас
          </label>
          <div className="flex flex-col gap-4 max-w-[400px]">
            <div className="h-12 flex items-center border border-[#E2E8F0] rounded-sm overflow-hidden focus-within:border-[#020617] transition-colors group">
              <span className="px-3 text-[#64748B] h-full flex items-center text-base font-medium font-manrope select-none border-r border-[#E2E8F0] group-focus-within:border-r-[#020617] transition-colors">
                +976
              </span>
              <input
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
                className="flex-1 px-3 py-3 outline-none text-[#020617] text-sm font-normal font-manrope placeholder:text-[#64748B]"
              />
            </div>
            {error && (
              <p className="text-[#F43F5E] font-normal text-sm font-manrope">
                {error}
              </p>
            )}
            <button
              onClick={handleSendOtp}
              disabled={!phone || loading}
              className="w-full h-11 bg-[#020617] text-white font-medium text-sm font-manrope rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1e293b] transition-colors"
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
