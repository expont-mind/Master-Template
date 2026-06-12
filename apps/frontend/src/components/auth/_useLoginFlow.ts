"use client";

import { SITE } from "@repo/config-site";
import { formatPhoneE164 } from "@repo/ui-utils/formatters";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getAuthCallbackUrl } from "@/lib/supabase/auth-helpers";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/stores/ui-store";

import type { Provider } from "@supabase/supabase-js";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// The login channel comes from config — `phone` sends an SMS OTP, `email`
// an email OTP. The `phone` state field holds whichever identifier the
// channel uses.
const AUTH_METHOD = SITE.auth.method;

function otpPayload(identifier: string) {
  return AUTH_METHOD === "email"
    ? { email: identifier.trim() }
    : { phone: formatPhoneE164(identifier) };
}

export function useLoginFlow() {
  const { isLoginOpen, closeLogin, loginRedirect } = useUIStore();
  const router = useRouter();

  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);

  // Handle open/close animation
  useEffect(() => {
    if (isLoginOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const navigateAfterLogin = () => {
    const redirect = loginRedirect;
    closeLogin();
    if (redirect) {
      router.push(redirect);
    }
  };

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
    navigateAfterLogin();
  };

  const handleSocialLogin = async (provider: Provider) => {
    const supabase = createClient();
    const redirectTo = getAuthCallbackUrl(loginRedirect || "/");
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
  };

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
    const { error: otpError } = await supabase.auth.signInWithOtp(otpPayload(phone));

    setLoading(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setShowOtpModal(true);
  };

  const handleLoginVerifyOtp = async (code: string): Promise<{ error?: string }> => {
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp(
      AUTH_METHOD === "email"
        ? { email: phone.trim(), token: code, type: "email" }
        : { phone: formatPhoneE164(phone), token: code, type: "sms" },
    );

    if (verifyError) {
      return { error: "Код буруу байна. Дахин оруулна уу." };
    }
    return {};
  };

  const handleLoginResendOtp = async (): Promise<{ error?: string }> => {
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp(otpPayload(phone));

    if (otpError) {
      return { error: otpError.message };
    }
    return {};
  };

  const handleVerified = async () => {
    setShowOtpModal(false);
    navigateAfterLogin();
  };

  const closeOtpModal = () => setShowOtpModal(false);

  const updatePhone = (val: string) => {
    setPhone(val);
    setError("");
  };

  return {
    closeLogin,
    visible,
    animate,
    phone,
    loading,
    error,
    showOtpModal,
    updatePhone,
    handleGuestLogin,
    handleSocialLogin,
    handleSendOtp,
    handleLoginVerifyOtp,
    handleLoginResendOtp,
    handleVerified,
    closeOtpModal,
  };
}
