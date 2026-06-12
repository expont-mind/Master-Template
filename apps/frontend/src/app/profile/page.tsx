"use client";

import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";

import { activatePoints } from "@/components/profile/actions";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { useWishlistStore } from "@/stores/wishlist-store";

import { ProfileContentRouter } from "./_components/ProfileContentRouter";
import { ProfileLoading } from "./_components/ProfileLoading";
import { ProfileMobileOrders } from "./_components/ProfileMobileOrders";
import { ProfileModals } from "./_components/ProfileModals";
import { useProfileData } from "./_hooks/useProfileData";
import { useProfileNavigation } from "./_hooks/useProfileNavigation";
import { useProfileView } from "./_hooks/useProfileView";
import { type ProfileView } from "./_lib/viewFromParams";

import type { SideMenu } from "@/components/profile/ProfileSidebar";

export interface ProfileOrder {
  id: string;
  order_number: string | null;
  status: string;
  delivery_status: string | null;
  total_amount: number;
  points_used: number;
  payment_status: string;
  payment_wallet: string | null;
  created_at: string;
  updated_at: string;
  coupon_discount: number;
  coupon_code: string | null;
  items: {
    id: string;
    product_id: string;
    price: number;
    quantity: number;
    variant_name: string | null;
    products: {
      name: string;
      slug: string;
      images: string[];
      price: number;
      discount_price: number | null;
    } | null;
  }[];
}

function resolveActiveMenu(view: ProfileView): SideMenu {
  if (view.type === "address-edit") return "address";
  if (view.type === "branches" || view.type === "faq") return "help";
  return view.type as SideMenu;
}

function ProfilePageContent() {
  const router = useRouter();
  const wishlistItems = useWishlistStore((s) => s.items);

  const { view, setView, tabParam, orderIdParam } = useProfileView();
  const {
    userData,
    orders,
    addresses,
    pointBalance,
    setPointBalance,
    loading,
    refreshAddresses,
    refreshUser,
  } = useProfileData();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [couponCount, setCouponCount] = useState(0);
  const [showActivationSuccess, setShowActivationSuccess] = useState(false);
  const [showActivation, setShowActivation] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [mobileOrderTab, setMobileOrderTab] = useState(0);

  const {
    handleMenuChange,
    handleLogout,
    handleEditAddress,
    handleAddNewAddress,
    handleBackFromEdit,
  } = useProfileNavigation({
    setView,
    pointActivatedAt: userData?.point_activated_at,
    setShowLogoutModal,
    setShowActivation,
    setIsLoggingOut,
  });

  const handleActivate = async () => {
    const result = await activatePoints();
    if (result.success) {
      setShowActivation(false);
      await refreshUser();
      setShowActivationSuccess(true);
    } else if (!result.success && result.error === "phone_not_verified") {
      setShowActivation(false);
      setShowPhoneVerification(true);
    }
  };

  const handlePhoneVerified = async () => {
    setShowPhoneVerification(false);
    await refreshUser();
    const result = await activatePoints();
    if (result.success) {
      setShowActivationSuccess(true);
    }
  };

  if (loading) {
    return <ProfileLoading />;
  }

  const activeMenu = resolveActiveMenu(view);
  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0] ?? null;

  return (
    <div className="w-full bg-white flex justify-center">
      <div
        className={`flex flex-col max-w-[1064px] w-full py-5 md:py-4 lg:px-0 ${tabParam === "point" ? "px-0 md:px-6" : "px-4 md:px-6"}`}
      >
        <p
          className={`px-0.5 pb-2 mb-0 md:mb-[10px] text-text-primary font-bold text-xl md:text-2xl lg:text-[26px] leading-7 md:leading-8 lg:leading-9 font-manrope ${tabParam ? "hidden lg:block" : ""}`}
        >
          Профайл
        </p>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-16 items-start">
          <div className={`w-full lg:w-auto ${tabParam ? "hidden lg:block" : ""}`}>
            <ProfileSidebar
              activeMenu={activeMenu}
              onMenuChange={handleMenuChange}
              user={userData}
              defaultAddress={defaultAddress}
              wishlistCount={wishlistItems.length}
              couponCount={couponCount}
              pointBalance={pointBalance}
            />

            <ProfileMobileOrders
              orders={orders}
              activeTab={mobileOrderTab}
              onTabChange={setMobileOrderTab}
              onAllOrders={() => handleMenuChange("orders")}
              onOrderClick={(orderId) => router.push(`/profile?tab=orders&orderId=${orderId}`)}
            />
          </div>

          <div className={`w-full lg:w-[720px] lg:shrink-0 ${tabParam ? "" : "hidden lg:block"}`}>
            <ProfileContentRouter
              view={view}
              userData={userData}
              orders={orders}
              addresses={addresses}
              orderIdParam={orderIdParam}
              onEditAddress={handleEditAddress}
              onAddNewAddress={handleAddNewAddress}
              onBackFromEdit={handleBackFromEdit}
              refreshAddresses={refreshAddresses}
              refreshUser={refreshUser}
              onBalanceChange={setPointBalance}
              onCouponCountChange={setCouponCount}
              onSettingsNavigate={handleMenuChange}
            />
          </div>
        </div>
      </div>

      <ProfileModals
        showLogoutModal={showLogoutModal}
        onCloseLogout={() => setShowLogoutModal(false)}
        onConfirmLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        showActivation={showActivation}
        hasPhone={!!userData?.primary_phone}
        onActivate={handleActivate}
        onCloseActivation={() => setShowActivation(false)}
        onNavigateToPhone={() => {
          setShowActivation(false);
          setShowPhoneVerification(true);
        }}
        showPhoneVerification={showPhoneVerification}
        onClosePhoneVerification={() => setShowPhoneVerification(false)}
        onPhoneVerified={handlePhoneVerified}
        showActivationSuccess={showActivationSuccess}
        onCloseActivationSuccess={() => {
          setShowActivationSuccess(false);
          setShowActivation(false);
        }}
        onViewBalance={() => {
          setShowActivationSuccess(false);
          setShowActivation(false);
          handleMenuChange("point");
        }}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfilePageContent />
    </Suspense>
  );
}
