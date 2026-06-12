"use client";

import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { type LoginState } from "./_useLogin";

const OTP_DIGIT_IDS = ["d1", "d2", "d3", "d4", "d5", "d6"] as const;

function OtpInputs({ state }: { state: LoginState }) {
  const { otpDigits, inputRefs, isLoading, handleOtpChange, handleOtpKeyDown, handleOtpPaste } =
    state;
  return (
    <div className="flex justify-center gap-2">
      {otpDigits.map((digit, index) => (
        <Input
          key={OTP_DIGIT_IDS[index]}
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
  );
}

export function OtpStep({ state }: { state: LoginState }) {
  const {
    email,
    otpDigits,
    error,
    isLoading,
    cooldown,
    handleVerifyOtp,
    handleResendOtp,
    handleBack,
  } = state;
  return (
    <>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Баталгаажуулах код</CardTitle>
        <CardDescription>
          <span className="font-medium text-foreground">{email}</span> хаягт илгээсэн 6 оронтой
          кодыг оруулна уу
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <OtpInputs state={state} />

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
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
          <Button variant="ghost" size="sm" onClick={handleBack} disabled={isLoading}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Буцах
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResendOtp}
            disabled={isLoading || cooldown > 0}
          >
            {cooldown > 0 ? `Дахин илгээх (${cooldown}с)` : "Код дахин илгээх"}
          </Button>
        </div>
      </CardContent>
    </>
  );
}
