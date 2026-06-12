"use client";

import { SITE } from "@repo/config-site";
import { createPortal } from "react-dom";

import { PhoneVerificationModal } from "@/components/profile/PhoneVerificationModal";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

import { LoginPhoneStep } from "./_LoginPhoneStep";
import { useLoginFlow } from "./_useLoginFlow";

export function LoginModal() {
  const {
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
  } = useLoginFlow();

  useScrollLock(visible);

  if (!visible || typeof window === "undefined") return null;

  return createPortal(
    <>
      {!showOtpModal && (
        <LoginPhoneStep
          animate={animate}
          phone={phone}
          loading={loading}
          error={error}
          onClose={closeLogin}
          onPhoneChange={updatePhone}
          onSendOtp={handleSendOtp}
          onSocialLogin={handleSocialLogin}
          onGuestLogin={handleGuestLogin}
        />
      )}

      <PhoneVerificationModal
        isOpen={showOtpModal}
        phone={phone}
        channel={SITE.auth.method}
        onClose={closeOtpModal}
        verifyOtp={handleLoginVerifyOtp}
        resendOtp={handleLoginResendOtp}
        onVerified={handleVerified}
      />
    </>,
    document.body,
  );
}
