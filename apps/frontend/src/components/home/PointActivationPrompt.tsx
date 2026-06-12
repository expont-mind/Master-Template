"use client";

import { SITE } from "@repo/config-site";
import { useState, useEffect } from "react";

import { activatePoints } from "@/components/profile/actions";
import { PhoneVerificationModal } from "@/components/profile/PhoneVerificationModal";
import { PointActivation } from "@/components/profile/PointActivation";
import { PointActivationSuccessModal } from "@/components/profile/PointActivationSuccessModal";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/stores/ui-store";

// Wrapper/inner split: when the point system is disabled, no hooks run and
// no Supabase auth/users fetch fires on the home page.
export function PointActivationPrompt() {
  if (!SITE.features.pointSystem) return null;
  return <PointActivationPromptInner />;
}

function PointActivationPromptInner() {
  const [showActivation, setShowActivation] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const openLogin = useUIStore((s) => s.openLogin);

  useEffect(() => {
    const check = async () => {
      const dismissed = localStorage.getItem("point_activation_dismissed");
      if (dismissed) return;

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoggedIn(false);
        setShowActivation(true);
        return;
      }

      setIsLoggedIn(true);

      const { data: userData } = await supabase
        .from("users")
        .select("point_activated_at, primary_phone")
        .eq("id", user.id)
        .maybeSingle();

      if (!userData) return;
      if (userData.point_activated_at) return;

      setHasPhone(!!userData.primary_phone);
      setShowActivation(true);
    };
    check();
  }, []);

  const refreshUser = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("primary_phone")
      .eq("id", user.id)
      .maybeSingle();

    if (data) setHasPhone(!!data.primary_phone);
  };

  return (
    <>
      <PointActivation
        isOpen={showActivation}
        hasPhone={hasPhone}
        onActivate={async () => {
          if (!isLoggedIn) {
            setShowActivation(false);
            openLogin();
            return;
          }
          const result = await activatePoints();
          if (result.success) {
            setShowActivation(false);
            setShowSuccess(true);
          } else if (!result.success && result.error === "phone_not_verified") {
            setShowActivation(false);
            setShowPhoneVerification(true);
          }
        }}
        onNavigateToPhone={() => {
          setShowActivation(false);
          if (!isLoggedIn) {
            openLogin();
            return;
          }
          setShowPhoneVerification(true);
        }}
        onClose={() => {
          setShowActivation(false);
          localStorage.setItem("point_activation_dismissed", "1");
        }}
      />
      <PhoneVerificationModal
        isOpen={showPhoneVerification}
        onClose={() => setShowPhoneVerification(false)}
        onVerified={async () => {
          setShowPhoneVerification(false);
          await refreshUser();
          const result = await activatePoints();
          if (result.success) {
            setShowSuccess(true);
          }
        }}
      />
      <PointActivationSuccessModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          setShowActivation(false);
          localStorage.setItem("point_activation_dismissed", "1");
        }}
        onViewBalance={() => {
          setShowSuccess(false);
          setShowActivation(false);
          localStorage.setItem("point_activation_dismissed", "1");
          window.location.href = "/profile?tab=point";
        }}
      />
    </>
  );
}
