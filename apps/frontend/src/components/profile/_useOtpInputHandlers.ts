"use client";

import { useCallback } from "react";

interface UseOtpInputHandlersInput {
  otp: string[];
  setOtp: React.Dispatch<React.SetStateAction<string[]>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  handleVerifyOtp: (code: string) => Promise<void> | void;
}

const EMPTY_OTP = ["", "", "", "", "", ""];

export function useOtpInputHandlers({
  otp,
  setOtp,
  setError,
  otpRefs,
  handleVerifyOtp,
}: UseOtpInputHandlersInput) {
  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      const digits = value.replace(/\D/g, "");
      if (digits.length > 1) {
        const newOtp = [...EMPTY_OTP];
        for (let i = 0; i < Math.min(digits.length, 6); i++) {
          newOtp[i] = digits[i];
        }
        setOtp(newOtp);
        setError("");
        const nextIndex = Math.min(digits.length, 5);
        otpRefs.current[nextIndex]?.focus();
        if (digits.length >= 6) handleVerifyOtp(digits.slice(0, 6));
        return;
      }
      const newOtp = [...otp];
      newOtp[index] = digits;
      setOtp(newOtp);
      setError("");
      if (digits && index < 5) otpRefs.current[index + 1]?.focus();
      const code = newOtp.join("");
      if (code.length === 6) handleVerifyOtp(code);
    },
    [otp, handleVerifyOtp, setOtp, setError, otpRefs],
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    },
    [otp, otpRefs],
  );

  const handleOtpPaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      if (!pasted) return;
      const newOtp = [...EMPTY_OTP];
      for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      otpRefs.current[nextIndex]?.focus();
      if (pasted.length === 6) handleVerifyOtp(pasted);
    },
    [handleVerifyOtp, setOtp, otpRefs],
  );

  return { handleOtpChange, handleOtpKeyDown, handleOtpPaste };
}
