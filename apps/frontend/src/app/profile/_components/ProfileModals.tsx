"use client";

import { LogoutModal } from "@/components/profile/LogoutModal";
import { PhoneVerificationModal } from "@/components/profile/PhoneVerificationModal";
import { PointActivation } from "@/components/profile/PointActivation";
import { PointActivationSuccessModal } from "@/components/profile/PointActivationSuccessModal";

interface ProfileModalsProps {
  showLogoutModal: boolean;
  onCloseLogout: () => void;
  onConfirmLogout: () => Promise<void>;
  isLoggingOut: boolean;

  showActivation: boolean;
  hasPhone: boolean;
  onActivate: () => Promise<void>;
  onCloseActivation: () => void;
  onNavigateToPhone: () => void;

  showPhoneVerification: boolean;
  onClosePhoneVerification: () => void;
  onPhoneVerified: () => Promise<void>;

  showActivationSuccess: boolean;
  onCloseActivationSuccess: () => void;
  onViewBalance: () => void;
}

/**
 * Bundles all the secondary modals rendered by the profile page. Keeps
 * the main page component focused on layout + state wiring.
 */
export const ProfileModals = ({
  showLogoutModal,
  onCloseLogout,
  onConfirmLogout,
  isLoggingOut,
  showActivation,
  hasPhone,
  onActivate,
  onCloseActivation,
  onNavigateToPhone,
  showPhoneVerification,
  onClosePhoneVerification,
  onPhoneVerified,
  showActivationSuccess,
  onCloseActivationSuccess,
  onViewBalance,
}: ProfileModalsProps) => {
  return (
    <>
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={onCloseLogout}
        onConfirm={onConfirmLogout}
        isLoggingOut={isLoggingOut}
      />
      <PointActivation
        isOpen={showActivation}
        hasPhone={hasPhone}
        onActivate={onActivate}
        onNavigateToPhone={onNavigateToPhone}
        onClose={onCloseActivation}
      />
      <PhoneVerificationModal
        isOpen={showPhoneVerification}
        onClose={onClosePhoneVerification}
        onVerified={onPhoneVerified}
      />
      <PointActivationSuccessModal
        isOpen={showActivationSuccess}
        onClose={onCloseActivationSuccess}
        onViewBalance={onViewBalance}
      />
    </>
  );
};
