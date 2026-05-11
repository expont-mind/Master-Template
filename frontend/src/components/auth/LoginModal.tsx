"use client";

import { useEffect, useState } from "react";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Cancel, Facebook, Google } from "@/components/svg";
import { useUIStore } from "@/stores/ui-store";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/supabase/auth-helpers";
import type { Provider } from "@supabase/supabase-js";
import { PhoneVerificationModal } from "@/components/profile/PhoneVerificationModal";

export function LoginModal() {
  const { isLoginOpen, closeLogin, loginRedirect } = useUIStore();
  const router = useRouter();

  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);

  useScrollLock(visible);

  // Handle open/close animation
  useEffect(() => {
    if (isLoginOpen) {
      setVisible(true);
      setPhone("");
      setError("");
      setLoading(false);
      setShowOtpModal(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    } else {
      setAnimate(false);
      setShowOtpModal(false);
      const timeout = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isLoginOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLogin();
    };

    if (visible) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, closeLogin]);

  const handleGuestLogin = async () => {
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: anonError } = await supabase.auth.signInAnonymously();
    setLoading(false);
    if (anonError) {
      setError(anonError.message);
      return;
    }
    const redirect = loginRedirect;
    closeLogin();
    if (redirect) {
      router.push(redirect);
    }
  };

  const handleSocialLogin = async (provider: Provider) => {
    const supabase = createClient();
    const redirectTo = getAuthCallbackUrl(loginRedirect || "/");
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
  };

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("976")) return `+${digits}`;
    return `+976${digits}`;
  };

  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 8) {
      setError("Зөв утасны дугаар оруулна уу");
      return;
    }
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: formatPhone(phone),
    });

    setLoading(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setShowOtpModal(true);
  };

  const handleLoginVerifyOtp = async (code: string): Promise<{ error?: string }> => {
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: formatPhone(phone),
      token: code,
      type: "sms",
    });

    if (verifyError) {
      return { error: "Код буруу байна. Дахин оруулна уу." };
    }
    return {};
  };

  const handleLoginResendOtp = async (): Promise<{ error?: string }> => {
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: formatPhone(phone),
    });

    if (otpError) {
      return { error: otpError.message };
    }
    return {};
  };

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <>
      {!showOtpModal && (
      <div className="fixed inset-0 z-999 flex items-center justify-center">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-[rgba(2,6,23,0.30)] transition-opacity duration-200"
          style={{ opacity: animate ? 1 : 0 }}
          onClick={closeLogin}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          className="relative w-full max-w-[375px] bg-white border border-[#E2E8F0] rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-all duration-200"
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
              className="text-[#020617] font-semibold text-xl font-manrope"
            >
              Нэвтрэх
            </p>
            <button
              onClick={closeLogin}
              className="p-1 cursor-pointer"
              aria-label="Хаах"
            >
              <Cancel />
            </button>
          </div>

          <div className="flex flex-col gap-[22px]">
            {/* Description */}
            <p className="text-[#020617] font-normal text-base font-manrope leading-6">
              Та нэвтрээд дуртай бүтээгдэхүүнээ хадгалж, захиалга өгөөрэй!
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-[22px]">
                {/* Phone Input */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-[#020617] font-normal text-sm font-manrope">
                    Утас
                  </label>
                  <div className="h-12 flex items-center border border-[#E2E8F0] rounded-sm overflow-hidden focus-within:border-[#020617] transition-colors group">
                    <span className="px-3 text-[#64748B] h-full flex items-center text-base font-medium font-manrope select-none border-r border-[#E2E8F0] group-focus-within:border-r-[#020617] transition-colors">
                      +976
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="Энд оруулна уу"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 8);
                        setPhone(val);
                        setError("");
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
                </div>

                {/* Continue Button */}
                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className={`w-full py-2.5 px-3 rounded-sm text-white font-normal text-base font-manrope transition-colors duration-200 ${
                    phone.length >= 8
                      ? "bg-[#020617] cursor-pointer hover:bg-[#1E293B]"
                      : "bg-[rgba(2,6,23,0.30)] cursor-not-allowed"
                  }`}
                >
                  {loading ? "Илгээж байна..." : "Үргэлжлүүлэх"}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-[#E2E8F0]" />
                <span className="text-[#64748B] font-medium text-xs font-manrope">
                  Эсвэл
                </span>
                <div className="flex-1 h-px bg-[#E2E8F0]" />
              </div>

              {/* Social Login Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleSocialLogin("facebook")}
                  className="relative w-full h-[50px] flex items-center gap-3 justify-center px-6 border border-[#E2E8F0] rounded-sm cursor-pointer hover:bg-[#F8FAFC] transition-colors duration-200"
                >
                  <Facebook />

                  <span className="text-[#475569] font-normal text-base font-manrope flex-1">
                    Facebook-р нэвтрэх
                  </span>
                </button>

                <button
                  onClick={() => handleSocialLogin("google")}
                  className="relative w-full h-[50px] flex items-center gap-3 justify-center px-6 border border-[#E2E8F0] rounded-sm cursor-pointer hover:bg-[#F8FAFC] transition-colors duration-200"
                >
                  <Google />

                  <span className="text-[#475569] font-normal text-base font-manrope flex-1">
                    Google-р нэвтрэх
                  </span>
                </button>

                {/* <button
                  onClick={() => handleSocialLogin("apple")}
                  className="relative w-full h-[50px] flex items-center gap-3 justify-center px-6 border border-[#E2E8F0] rounded-sm cursor-pointer hover:bg-[#F8FAFC] transition-colors duration-200"
                >
                  <Apple />

                  <span className="text-[#475569] font-normal text-base font-manrope flex-1">
                    Apple-р нэвтрэх
                  </span>
                </button> */}
              </div>

              {/* Guest divider */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-[#E2E8F0]" />
                <span className="text-[#64748B] font-medium text-xs font-manrope">
                  Эсвэл
                </span>
                <div className="flex-1 h-px bg-[#E2E8F0]" />
              </div>

              {/* Guest login button */}
              <button
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full py-2.5 px-3 rounded-sm text-[#475569] font-normal text-base font-manrope border border-[#E2E8F0] cursor-pointer hover:bg-[#F8FAFC] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Уншиж байна..." : "Зочноор үргэлжлүүлэх"}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      <PhoneVerificationModal
        isOpen={showOtpModal}
        phone={phone}
        onClose={() => setShowOtpModal(false)}
        verifyOtp={handleLoginVerifyOtp}
        resendOtp={handleLoginResendOtp}
        onVerified={async () => {
          setShowOtpModal(false);
          const redirect = loginRedirect;
          closeLogin();
          if (redirect) {
            router.push(redirect);
          }
        }}
      />
    </>,
    document.body,
  );
}
