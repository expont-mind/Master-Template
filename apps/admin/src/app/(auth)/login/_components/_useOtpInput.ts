"use client";

import { useRef } from "react";

const EMPTY_OTP = ["", "", "", "", "", ""];

interface UseOtpInputArgs {
  otpDigits: string[];
  setOtpDigits: (digits: string[]) => void;
  onComplete: (digits: string[]) => void;
}

export function useOtpInput({ otpDigits, setOtpDigits, onComplete }: UseOtpInputArgs) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newDigits.every((d) => d !== "")) {
      setTimeout(() => onComplete(newDigits), 0);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newDigits = [...EMPTY_OTP];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);
    if (pasted.length === 6) setTimeout(() => onComplete(newDigits), 0);
  };

  return { inputRefs, handleChange, handleKeyDown, handlePaste };
}

export { EMPTY_OTP };
