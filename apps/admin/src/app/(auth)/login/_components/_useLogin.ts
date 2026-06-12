"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { EMPTY_OTP, useOtpInput } from "./_useOtpInput";

export type LoginStep = "email" | "code";

function parseRateLimitMessage(message: string): string {
  const match = message.match(/(\d+)\s*second/);
  if (match) {
    return `Имэйл илгээх хязгаарт хүрлээ. ${match[1]} секундын дараа дахин оролдоно уу.`;
  }
  return "Имэйл илгээх хязгаарт хүрлээ. Хэсэг хугацааны дараа дахин оролдоно уу.";
}

function isRateLimitError(err: { message: string; status?: number }): boolean {
  return (
    err.message.includes("security purposes") || err.message.includes("rate") || err.status === 429
  );
}

function useCooldownTimer() {
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  return { cooldown, setCooldown };
}

export function useLogin() {
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(EMPTY_OTP);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { cooldown, setCooldown } = useCooldownTimer();

  const sendSupabaseOtp = async (): Promise<boolean> => {
    const { error: otpError } = await supabase.auth.signInWithOtp({ email });
    if (otpError) {
      setError(
        isRateLimitError(otpError)
          ? parseRateLimitMessage(otpError.message)
          : otpError.message || "Код илгээхэд алдаа гарлаа",
      );
      return false;
    }
    return true;
  };

  const verifyTokenHash = async (tokenHash: string): Promise<boolean> => {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });
    if (verifyError) {
      setError("Нэвтрэхэд алдаа гарлаа");
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/direct-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Нэвтрэхэд алдаа гарлаа");
        return;
      }
      if (!data.twoFactorEnabled && data.token_hash) {
        if (await verifyTokenHash(data.token_hash)) {
          router.push("/dashboard");
          router.refresh();
        }
        return;
      }
      const sent = await sendSupabaseOtp();
      if (!sent) return;
      setStep("code");
      setCooldown(60);
      setOtpDigits(EMPTY_OTP);
    } catch {
      setError("Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = useCallback(
    async (digits: string[]) => {
      const code = digits.join("");
      if (code.length !== 6) {
        setError("6 оронтой код оруулна уу");
        return;
      }
      setError(null);
      setIsLoading(true);
      try {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: "email",
        });
        if (verifyError) {
          setError(
            isRateLimitError(verifyError)
              ? parseRateLimitMessage(verifyError.message)
              : "Код буруу эсвэл хугацаа дууссан байна",
          );
          return;
        }
        router.push("/dashboard");
        router.refresh();
      } catch {
        setError("Баталгаажуулахад алдаа гарлаа. Дахин оролдоно уу.");
      } finally {
        setIsLoading(false);
      }
    },
    [email, supabase, router],
  );

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setError(null);
    setIsLoading(true);
    try {
      const sent = await sendSupabaseOtp();
      if (!sent) return;
      setCooldown(60);
      setOtpDigits(EMPTY_OTP);
    } catch {
      setError("Код дахин илгээхэд алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  };

  const otp = useOtpInput({
    otpDigits,
    setOtpDigits,
    onComplete: handleVerifyOtp,
  });

  const handleBack = () => {
    setStep("email");
    setError(null);
    setOtpDigits(EMPTY_OTP);
  };

  return {
    step,
    email,
    setEmail,
    otpDigits,
    error,
    isLoading,
    cooldown,
    inputRefs: otp.inputRefs,
    handleLogin,
    handleVerifyOtp,
    handleResendOtp,
    handleOtpChange: otp.handleChange,
    handleOtpKeyDown: otp.handleKeyDown,
    handleOtpPaste: otp.handlePaste,
    handleBack,
  };
}

export type LoginState = ReturnType<typeof useLogin>;
