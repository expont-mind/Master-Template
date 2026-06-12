"use client";

import { useRouter } from "next/navigation";

import { type ProfileView } from "@/app/profile/_lib/viewFromParams";
import { type SideMenu } from "@/components/profile/ProfileSidebar";
import { createClient } from "@/lib/supabase/client";

interface UseProfileNavigationParams {
  setView: React.Dispatch<React.SetStateAction<ProfileView>>;
  pointActivatedAt: string | null | undefined;
  setShowLogoutModal: (v: boolean) => void;
  setShowActivation: (v: boolean) => void;
  setIsLoggingOut: (v: boolean) => void;
}

interface UseProfileNavigationResult {
  handleMenuChange: (menu: SideMenu) => void;
  handleLogout: () => Promise<void>;
  handleEditAddress: (id: string) => void;
  handleAddNewAddress: () => void;
  handleBackFromEdit: () => void;
}

/**
 * Bundle of navigation callbacks used by the profile page. Keeps the
 * page component free of imperative router/setView wiring.
 */
export function useProfileNavigation({
  setView,
  pointActivatedAt,
  setShowLogoutModal,
  setShowActivation,
  setIsLoggingOut,
}: UseProfileNavigationParams): UseProfileNavigationResult {
  const router = useRouter();

  const handleMenuChange = (menu: SideMenu) => {
    if (menu === "logout") {
      setShowLogoutModal(true);
      return;
    }
    if (menu === "wishlist") {
      router.push("/wishlist");
      return;
    }
    // Show activation modal without navigating when point not activated.
    if (menu === "point" && !pointActivatedAt) {
      setShowActivation(true);
      return;
    }
    // Navigate with URL param for mobile back navigation support.
    router.push(`/profile?tab=${menu}`);
    setView({ type: menu as ProfileView["type"] });
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleEditAddress = (id: string) => {
    router.push(`/profile?tab=address&action=edit&id=${id}`);
  };

  const handleAddNewAddress = () => {
    router.push("/profile?tab=address&action=new");
  };

  const handleBackFromEdit = () => {
    router.push("/profile?tab=address");
  };

  return {
    handleMenuChange,
    handleLogout,
    handleEditAddress,
    handleAddNewAddress,
    handleBackFromEdit,
  };
}
