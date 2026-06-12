"use client";

// Hook backing PhoneVerificationModal: holds the local form state and
// wraps Supabase phone-OTP + custom verify/resend callbacks.

import { formatPhoneE164 } from "@repo/ui-utils/formatters";
import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import {
  applyPhoneVerificationOpenReset,
  EMPTY_OTP,
  OTP_COOLDOWN,
} from "./_phoneVerificationHelpers";
import { useOtpInputHandlers } from "./_useOtpInputHandlers";

interface UsePhoneVerificationInput {
  isOpen: boolean;
  phoneProp?: string;
  onVerified: () => Promise<void>;
  customVerifyOtp?: (code: string) => Promise<{ error?: string }>;
  customResendOtp?: () => Promise<{ error?: string }>;
}

// Update primary_phone in users table after a successful phone change.
async function persistPhoneToUsersTable(digits: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("users").update({ primary_phone: digits }).eq("id", user.id);
  }
}

// Try to update the auth user's phone. Falls back to signInWithOtp when
// the phone is already registered. Returns the next state.
async function sendOtpForPhone(
  phoneInput: string,
): Promise<{ ok: true; useSignIn: boolean } | { ok: false; error: string }> {
  const supabase = createClient();
  const fullPhone = formatPhoneE164(phoneInput);
  const { error: authError } = await supabase.auth.updateUser({
    phone: fullPhone,
  });
  if (!authError) return { ok: true, useSignIn: false };

  if (authError.message.includes("already been registered")) {
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: fullPhone,
    });
    if (otpError) return { ok: false, error: otpError.message };
    return { ok: true, useSignIn: true };
  }

  return { ok: false, error: authError.message };
}

async function resendOtpForPhone(
  phone: string,
  useSignIn: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const digits = phone.replace(/\D/g, "");
  const fullPhone = formatPhoneE164(digits);
  if (useSignIn) {
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: fullPhone,
    });
    if (otpError) return { ok: false, error: otpError.message };
    return { ok: true };
  }
  const { error: authError } = await supabase.auth.updateUser({
    phone: fullPhone,
  });
  if (authError) return { ok: false, error: authError.message };
  return { ok: true };
}

async function verifyOtpForPhone(
  phone: string,
  code: string,
  useSignIn: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const digits = phone.replace(/\D/g, "");
  const { error: verifyError } = await supabase.auth.verifyOtp({
    phone: formatPhoneE164(digits),
    token: code,
    type: useSignIn ? "sms" : "phone_change",
  });
  if (verifyError) {
    return { ok: false, error: "Код буруу байна. Дахин оруулна уу." };
  }
  await persistPhoneToUsersTable(digits);
  return { ok: true };
}

export function usePhoneVerification({
  isOpen,
  phoneProp,
  onVerified,
  customVerifyOtp,
  customResendOtp,
}: UsePhoneVerificationInput) {
  const [step, setStep] = useState<"phone" | "otp">("otp");
  const [phoneInput, setPhoneInput] = useState("");
  const [otp, setOtp] = useState([...EMPTY_OTP]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [useSignIn, setUseSignIn] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const phone = phoneProp || phoneInput;

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Reset state when modal opens
  useEffect(() => {
    if (!isOpen) return;
    applyPhoneVerificationOpenReset({
      phoneProp,
      setOtp,
      setError,
      setLoading,
      setPhoneInput,
      setUseSignIn,
      setStep,
      setCountdown,
      otpRefs,
    });
  }, [isOpen, phoneProp]);

  const focusFirstOtp = useCallback(() => {
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  }, []);

  const handleSendOtp = useCallback(async () => {
    const digits = phoneInput.replace(/\D/g, "");
    if (digits.length !== 8) {
      setError("Зөв утасны дугаар оруулна уу");
      return;
    }
    setError("");
    setLoading(true);
    const result = await sendOtpForPhone(digits);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setUseSignIn(result.useSignIn);
    setOtp([...EMPTY_OTP]);
    setStep("otp");
    setCountdown(OTP_COOLDOWN);
    focusFirstOtp();
  }, [phoneInput, focusFirstOtp]);

  const handleResendOtp = useCallback(async () => {
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
      const result = await resendOtpForPhone(phone, useSignIn);
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
    }
    setOtp([...EMPTY_OTP]);
    setCountdown(OTP_COOLDOWN);
    focusFirstOtp();
  }, [customResendOtp, phone, useSignIn, focusFirstOtp]);

  const handleVerifyOtp = useCallback(
    async (code: string) => {
      if (code.length !== 6) return;
      setError("");
      setLoading(true);

      const result = customVerifyOtp
        ? await customVerifyOtp(code)
        : await verifyOtpForPhone(phone, code, useSignIn);

      if ("error" in result && result.error) {
        setLoading(false);
        setError(result.error);
        setOtp([...EMPTY_OTP]);
        focusFirstOtp();
        return;
      }
      if ("ok" in result && !result.ok) {
        // pattern shouldn't hit — verifyOtpForPhone returned ok:false with error above
        setLoading(false);
        return;
      }

      await onVerified();
      setLoading(false);
    },
    [customVerifyOtp, phone, useSignIn, onVerified, focusFirstOtp],
  );

  const { handleOtpChange, handleOtpKeyDown, handleOtpPaste } = useOtpInputHandlers({
    otp,
    setOtp,
    setError,
    otpRefs,
    handleVerifyOtp,
  });

  const handleBackToPhoneStep = useCallback(() => {
    setStep("phone");
    setOtp([...EMPTY_OTP]);
    setError("");
    setCountdown(0);
  }, []);

  return {
    step,
    phone,
    phoneInput,
    setPhoneInput,
    otp,
    loading,
    error,
    setError,
    countdown,
    otpRefs,
    handleSendOtp,
    handleResendOtp,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleBackToPhoneStep,
  };
}
