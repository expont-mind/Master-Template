"use client";

const EMPTY_OTP: string[] = ["", "", "", "", "", ""];
const OTP_COOLDOWN = 90;

interface ApplyOpenResetInput {
  phoneProp: string | undefined;
  setOtp: React.Dispatch<React.SetStateAction<string[]>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setPhoneInput: React.Dispatch<React.SetStateAction<string>>;
  setUseSignIn: React.Dispatch<React.SetStateAction<boolean>>;
  setStep: React.Dispatch<React.SetStateAction<"phone" | "otp">>;
  setCountdown: React.Dispatch<React.SetStateAction<number>>;
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
}

export function applyPhoneVerificationOpenReset(input: ApplyOpenResetInput) {
  const {
    phoneProp,
    setOtp,
    setError,
    setLoading,
    setPhoneInput,
    setUseSignIn,
    setStep,
    setCountdown,
    otpRefs,
  } = input;
  setOtp([...EMPTY_OTP]);
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
}

export { EMPTY_OTP, OTP_COOLDOWN };
