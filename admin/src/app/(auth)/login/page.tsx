"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";

type LoginStep = "email" | "code";

function parseRateLimitMessage(message: string): string {
  const match = message.match(/(\d+)\s*second/);
  if (match) {
    return `Имэйл илгээх хязгаарт хүрлээ. ${match[1]} секундын дараа дахин оролдоно уу.`;
  }
  return "Имэйл илгээх хязгаарт хүрлээ. Хэсэг хугацааны дараа дахин оролдоно уу.";
}

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();
  const supabase = createClient();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Supabase OTP илгээх + rate limit шалгах
  const sendSupabaseOtp = async (): Promise<boolean> => {
    const { error: otpError } = await supabase.auth.signInWithOtp({ email });

    if (otpError) {
      if (
        otpError.message.includes("security purposes") ||
        otpError.message.includes("rate") ||
        otpError.status === 429
      ) {
        setError(parseRateLimitMessage(otpError.message));
      } else {
        setError(otpError.message || "Код илгээхэд алдаа гарлаа");
      }
      return false;
    }

    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Нэг API дуудалтаар admin шалгах + 2FA тохиргоо авах
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

      // 2FA OFF → шууд нэвтрэх
      if (!data.twoFactorEnabled && data.token_hash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: "magiclink",
        });

        if (verifyError) {
          setError("Нэвтрэхэд алдаа гарлаа");
          return;
        }

        router.push("/dashboard");
        router.refresh();
        return;
      }

      // 2FA ON → Supabase OTP илгээх
      const sent = await sendSupabaseOtp();
      if (!sent) return;

      setStep("code");
      setCooldown(60);
      setOtpDigits(["", "", "", "", "", ""]);
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
          if (
            verifyError.message.includes("security purposes") ||
            verifyError.message.includes("rate") ||
            verifyError.status === 429
          ) {
            setError(parseRateLimitMessage(verifyError.message));
          } else {
            setError("Код буруу эсвэл хугацаа дууссан байна");
          }
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
      setOtpDigits(["", "", "", "", "", ""]);
    } catch {
      setError("Код дахин илгээхэд алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d !== "")) {
      setTimeout(() => handleVerifyOtp(newDigits), 0);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);

    if (pasted.length === 6) {
      setTimeout(() => handleVerifyOtp(newDigits), 0);
    }
  };

  const handleBack = () => {
    setStep("email");
    setError(null);
    setOtpDigits(["", "", "", "", "", ""]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        {step === "email" ? (
          <>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">
                Монпанг Админ
              </CardTitle>
              <CardDescription>
                Имэйл хаягаа оруулан нэвтэрнэ үү
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Имэйл</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@monpang.mn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Нэвтэрж байна...
                    </>
                  ) : (
                    "Нэвтрэх"
                  )}
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">
                Баталгаажуулах код
              </CardTitle>
              <CardDescription>
                <span className="font-medium text-foreground">{email}</span>{" "}
                хаягт илгээсэн 6 оронтой кодыг оруулна уу
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center gap-2">
                {otpDigits.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    disabled={isLoading}
                    className="w-12 h-14 text-center text-2xl font-bold"
                  />
                ))}
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button
                onClick={() => handleVerifyOtp(otpDigits)}
                className="w-full"
                disabled={isLoading || otpDigits.some((d) => d === "")}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Шалгаж байна...
                  </>
                ) : (
                  "Баталгаажуулах"
                )}
              </Button>

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Буцах
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResendOtp}
                  disabled={isLoading || cooldown > 0}
                >
                  {cooldown > 0
                    ? `Дахин илгээх (${cooldown}с)`
                    : "Код дахин илгээх"}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
