"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { Cancel } from "../svg";
import { createClient } from "@/lib/supabase/client";
import { PrimaryHeading } from "@/components/ui/typography";

const OTP_COOLDOWN = 90;

interface PhoneVerificationModalProps {
  isOpen: boolean;
  phone?: string;
  onClose: () => void;
  onVerified: () => Promise<void>;
  verifyOtp?: (code: string) => Promise<{ error?: string }>;
  resendOtp?: () => Promise<{ error?: string }>;
}

export const PhoneVerificationModal = ({
  isOpen,
  phone: phoneProp,
  onClose,
  onVerified,
  verifyOtp: customVerifyOtp,
  resendOtp: customResendOtp,
}: PhoneVerificationModalProps) => {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("otp");
  const [phoneInput, setPhoneInput] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [useSignIn, setUseSignIn] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const phone = phoneProp || phoneInput;

  useScrollLock(visible);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Handle open/close animation
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setLoading(false);
      setPhoneInput("");
      setUseSignIn(false);
      if (phoneProp) {
        setStep("otp");
        setCountdown(OTP_COOLDOWN);
        setTimeout(() => otpRefs.current[0]?.focus(), 200);
      } else {
        setStep("phone");
        setCountdown(0);
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    } else {
      setAnimate(false);
      const timeout = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, phoneProp]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (visible) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, onClose]);

  const handleSendOtp = async () => {
    const digits = phoneInput.replace(/\D/g, "");
    if (digits.length !== 8) {
      setError("Зөв утасны дугаар оруулна уу");
      return;
    }
    setError("");
    setLoading(true);

    const supabase = createClient();
    const fullPhone = "+976" + digits;
    const { error: authError } = await supabase.auth.updateUser({
      phone: fullPhone,
    });

    if (authError) {
      // Phone already registered — fall back to signInWithOtp
      if (authError.message.includes("already been registered")) {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone: fullPhone,
        });
        setLoading(false);
        if (otpError) {
          setError(otpError.message);
          return;
        }
        setUseSignIn(true);
      } else {
        setLoading(false);
        setError(authError.message);
        return;
      }
    } else {
      setLoading(false);
    }

    setOtp(["", "", "", "", "", ""]);
    setStep("otp");
    setCountdown(OTP_COOLDOWN);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handleResendOtp = async () => {
    setError("");
    setLoading(true);

    if (customResendOtp) {
      const result = await customResendOtp();
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
    } else {
      const digits = phone.replace(/\D/g, "");
      const supabase = createClient();
      const fullPhone = "+976" + digits;

      if (useSignIn) {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone: fullPhone,
        });
        setLoading(false);
        if (otpError) {
          setError(otpError.message);
          return;
        }
      } else {
        const { error: authError } = await supabase.auth.updateUser({
          phone: fullPhone,
        });
        setLoading(false);
        if (authError) {
          setError(authError.message);
          return;
        }
      }
    }

    setOtp(["", "", "", "", "", ""]);
    setCountdown(OTP_COOLDOWN);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handleVerifyOtp = async (code: string) => {
    if (code.length !== 6) return;
    setError("");
    setLoading(true);

    if (customVerifyOtp) {
      const result = await customVerifyOtp(code);
      if (result.error) {
        setLoading(false);
        setError(result.error);
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
        return;
      }
    } else {
      const supabase = createClient();
      const digits = phone.replace(/\D/g, "");

      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: "+976" + digits,
        token: code,
        type: useSignIn ? "sms" : "phone_change",
      });

      if (verifyError) {
        setLoading(false);
        setError("Код буруу байна. Дахин оруулна уу.");
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
        return;
      }

      // Update primary_phone in users table
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("users")
          .update({ primary_phone: digits })
          .eq("id", user.id);
      }
    }

    await onVerified();
    setLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");

    // iOS autofill: full OTP code received at once
    if (digits.length > 1) {
      const newOtp = ["", "", "", "", "", ""];
      for (let i = 0; i < Math.min(digits.length, 6); i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      setError("");
      const nextIndex = Math.min(digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
      if (digits.length >= 6) {
        handleVerifyOtp(digits.slice(0, 6));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = digits;
    setOtp(newOtp);
    setError("");

    if (digits && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    const code = newOtp.join("");
    if (code.length === 6) {
      handleVerifyOtp(code);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;

    const newOtp = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);

    const nextIndex = Math.min(pasted.length, 5);
    otpRefs.current[nextIndex]?.focus();

    if (pasted.length === 6) {
      handleVerifyOtp(pasted);
    }
  };

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[rgba(2,6,23,0.30)] transition-opacity duration-200"
        style={{ opacity: animate ? 1 : 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[375px] bg-white border border-[#E2E8F0] rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6 transition-all duration-200 mx-4"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "scale(1)" : "scale(0.95)",
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step === "otp" && !phoneProp && (
              <button
                onClick={() => {
                  setStep("phone");
                  setOtp(["", "", "", "", "", ""]);
                  setError("");
                  setCountdown(0);
                }}
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
            <PrimaryHeading>
              {step === "phone" ? "Идэвхжүүлэх" : "Баталгаажуулах"}
            </PrimaryHeading>
          </div>
          <button
            onClick={onClose}
            className="p-1 cursor-pointer"
            aria-label="Хаах"
          >
            <Cancel />
          </button>
        </div>

        <div className="flex flex-col gap-[22px] pb-1.5">
          {step === "phone" ? (
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
                    placeholder="99123456"
                    value={phoneInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                      setPhoneInput(val);
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

              {/* Activate Button */}
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className={`w-full py-2.5 px-3 h-11 rounded-sm text-white font-normal text-base font-manrope transition-colors duration-200 ${
                  phoneInput.length >= 8
                    ? "bg-[#020617] cursor-pointer hover:bg-[#1E293B]"
                    : "bg-[rgba(2,6,23,0.30)] cursor-not-allowed"
                }`}
              >
                {loading ? "Илгээж байна..." : "Идэвхжүүлэх"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Description */}
              <p className="text-[#020617] font-normal text-sm font-manrope leading-6">
                Таны <span className="font-semibold">{phone}</span> дугаарт
                илгээсэн 6 оронтой баталгаажуулах кодыг оруулна уу.
              </p>

              {/* OTP Inputs */}
              <div className="flex flex-col gap-2">
                <div
                  className="flex items-center justify-center gap-3"
                  onPaste={handleOtpPaste}
                >
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={i === 0 ? "one-time-code" : "off"}
                      {...(i !== 0 && { maxLength: 1 })}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-11 h-11 text-center text-lg font-semibold font-manrope text-[#020617] border border-[#E2E8F0] rounded-[10px] outline-none focus:border-[#020617] transition-colors"
                    />
                  ))}
                </div>
                {error && (
                  <p className="text-[#F43F5E] font-normal text-sm font-manrope text-center">
                    {error}
                  </p>
                )}
              </div>
              <div className="flex flex-col py-10">
                {loading && (
                  <p className="text-[#64748B] font-normal text-sm font-manrope text-center">
                    Шалгаж байна...
                  </p>
                )}

                {/* Countdown */}
                {!loading && countdown > 0 && (
                  <p className="text-[#64748B] font-normal text-sm font-manrope text-center">
                    Код хүчинтэй: {countdown}с
                  </p>
                )}

                {/* Resend - only shown after countdown expires */}
                {!loading && countdown === 0 && (
                  <div className="flex items-center justify-center">
                    <button
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-[#020617] font-medium text-sm font-manrope underline underline-offset-4 cursor-pointer hover:text-[#64748B] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Дахин илгээх
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
