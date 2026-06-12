"use client";

import { SITE } from "@repo/config-site";
import { formatPhoneE164 } from "@repo/ui-utils/formatters";
import { useEffect, useRef, useState } from "react";

import { getAuthCallbackUrl } from "@/lib/supabase/auth-helpers";
import { createClient } from "@/lib/supabase/client";

import type { Provider, User as SupabaseUser } from "@supabase/supabase-js";

const OTP_COOLDOWN = 90;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

// The login channel comes from config — `phone` sends an SMS OTP, `email`
// an email OTP. The `phone` state field holds whichever identifier the
// channel uses.
const AUTH_METHOD = SITE.auth.method;

export function useWishlistAuth() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthChecked(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSendOtp = async () => {
    if (AUTH_METHOD === "email") {
      if (!EMAIL_RE.test(phone.trim())) {
        setError("Зөв имэйл хаяг оруулна уу");
        return;
      }
    } else {
      const digits = phone.replace(/\D/g, "");
      if (digits.length !== 8) {
        setError("Зөв утасны дугаар оруулна уу");
        return;
      }
    }
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp(
      AUTH_METHOD === "email" ? { email: phone.trim() } : { phone: formatPhoneE164(phone) },
    );
    setLoading(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setOtp(["", "", "", "", "", ""]);
    setStep("otp");
    setCountdown(OTP_COOLDOWN);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handleVerifyOtp = async (code: string) => {
    if (code.length !== 6) return;
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp(
      AUTH_METHOD === "email"
        ? { email: phone.trim(), token: code, type: "email" }
        : { phone: formatPhoneE164(phone), token: code, type: "sms" },
    );
    setLoading(false);
    if (verifyError) {
      setError("Код буруу байна. Дахин оруулна уу.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");

    if (digits.length > 1) {
      const newOtp = ["", "", "", "", "", ""];
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
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    const nextIndex = Math.min(pasted.length, 5);
    otpRefs.current[nextIndex]?.focus();
    if (pasted.length === 6) handleVerifyOtp(pasted);
  };

  const handleSocialLogin = async (provider: Provider) => {
    const supabase = createClient();
    const redirectTo = getAuthCallbackUrl("/wishlist");
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
  };

  const resetToPhoneStep = () => {
    setStep("phone");
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setCountdown(0);
  };

  return {
    user,
    authChecked,
    step,
    phone,
    setPhone,
    otp,
    loading,
    error,
    setError,
    countdown,
    otpRefs,
    handleSendOtp,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleSocialLogin,
    resetToPhoneStep,
  };
}

export type WishlistAuthState = ReturnType<typeof useWishlistAuth>;
