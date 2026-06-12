"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useRef, useState, useEffect } from "react";

import { NotificationPanel } from "@/components/notification";
import { Monpang } from "@/components/svg";
import {
  useDefaultAddress,
  useAllAddresses,
  useSetDefaultAddress,
} from "@/lib/hooks/useDefaultAddress";
import { useUnreadNotificationCount, useRealtimeNotifications } from "@/lib/hooks/useNotifications";
import { ROUTES } from "@/lib/utils/constants";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import { useWishlistStore } from "@/stores/wishlist-store";

import { HeaderActions } from "./_components/HeaderActions";
import { HeaderAddressPicker } from "./_components/HeaderAddressPicker";
import { HeaderCategoryButtons } from "./_components/HeaderCategoryButtons";
import { HeaderCategoryDropdown } from "./_components/HeaderCategoryDropdown";
import { HeaderModals } from "./_components/HeaderModals";
import { HeaderNavLinks } from "./_components/HeaderNavLinks";
import { HeaderSearchTrigger } from "./_components/HeaderSearchTrigger";
import { useCategoryDropdown } from "./_hooks/useCategoryDropdown";
import { useHeaderUser } from "./_hooks/useHeaderUser";
import { useHideOnScroll } from "./_hooks/useHideOnScroll";
import { usePointBalance } from "./_hooks/usePointBalance";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    openLogin,
    isNotificationOpen,
    toggleNotification,
    closeNotification,
    showTopHeader,
    setShowTopHeader,
    openPointGiftModal,
  } = useUIStore();
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const user = useHeaderUser();

  // Get unread notification count
  const { data: unreadCount } = useUnreadNotificationCount(user?.id);

  // Enable realtime notifications subscription
  useRealtimeNotifications(user?.id, {
    onPointGift: (amount, description) => {
      openPointGiftModal(amount, description);
    },
  });

  // Get cart and wishlist counts
  const cartCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.items.length);

  // Track hydration to avoid mismatch with localStorage-persisted stores
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    // Intentional one-shot client-mount flag to gate SSR/client-render mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  const pointBalance = usePointBalance(user?.id);

  // Get user's default address
  const { data: defaultAddress } = useDefaultAddress(user?.id);
  const { data: allAddresses = [] } = useAllAddresses(user?.id);
  const setDefaultAddress = useSetDefaultAddress(user?.id);

  useHideOnScroll(setShowTopHeader);

  const handleProfileClick = useCallback(() => {
    if (user) {
      router.push("/profile");
    } else {
      openLogin("/profile");
    }
  }, [user, router, openLogin]);

  const { isCategoryOpen, setIsCategoryOpen, closeTimeoutRef } = useCategoryDropdown(headerRef);

  return (
    <div ref={headerRef}>
      <div className="fixed top-0 left-0 right-0 z-100 bg-white flex flex-col">
        <header
          className={`w-full bg-white flex flex-col items-center overflow-hidden transition-[max-height] duration-300 ${showTopHeader ? "max-h-20" : "max-h-0"}`}
        >
          <div className="pt-1 md:pt-4 pb-0 md:pb-3 px-4 xl:px-0 flex items-center justify-between max-w-[1064px] w-full gap-3">
            <HeaderSearchTrigger onOpen={() => setIsSearchOpen(true)} />

            <Link href="/" className="shrink-0">
              <Monpang />
            </Link>

            <HeaderActions
              hasMounted={hasMounted}
              cartCount={cartCount}
              wishlistCount={wishlistCount}
              unreadCount={unreadCount}
              pointBalance={pointBalance}
              notificationRef={notificationRef}
              onMobileSearchOpen={() => setIsSearchOpen(true)}
              onToggleNotification={toggleNotification}
              onProfileClick={handleProfileClick}
            />
          </div>
        </header>

        {/* Bottom nav */}
        <nav className="w-full bg-white flex justify-center border-b border-border">
          <div className="w-full max-w-[1064px] px-0 flex justify-between items-center">
            <div className="flex items-center gap-0 md:gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              <HeaderCategoryButtons
                pathname={pathname}
                closeTimeoutRef={closeTimeoutRef}
                setIsCategoryOpen={setIsCategoryOpen}
                setIsMobileCategoryOpen={setIsMobileCategoryOpen}
                onDesktopClick={() => {
                  setIsCategoryOpen(false);
                  router.push(ROUTES.PRODUCTS);
                }}
              />

              <div className="px-2">
                <div className="h-[30px] w-px bg-border"></div>
              </div>

              <HeaderNavLinks pathname={pathname} />
            </div>

            <HeaderAddressPicker
              defaultAddress={defaultAddress}
              onClick={() => setIsAddressModalOpen(true)}
            />
          </div>

          {/* Category Dropdown - smooth slide down */}
          <HeaderCategoryDropdown
            isCategoryOpen={isCategoryOpen}
            closeTimeoutRef={closeTimeoutRef}
            setIsCategoryOpen={setIsCategoryOpen}
          />
        </nav>

        {/* Notification Panel - positioned outside header to avoid overflow-hidden */}
        <NotificationPanel
          isOpen={isNotificationOpen}
          onClose={closeNotification}
          userId={user?.id}
          anchorRef={notificationRef}
        />
      </div>

      {/* Spacer for fixed header */}
      <div className="h-[93px] md:h-[132px]" />

      <HeaderModals
        isSearchOpen={isSearchOpen}
        onSearchClose={() => setIsSearchOpen(false)}
        isAddressModalOpen={isAddressModalOpen}
        onAddressModalClose={() => setIsAddressModalOpen(false)}
        allAddresses={allAddresses}
        defaultAddressId={defaultAddress?.id || null}
        onAddressSelect={(id) => setDefaultAddress.mutate(id)}
        isMobileCategoryOpen={isMobileCategoryOpen}
        onMobileCategoryClose={() => setIsMobileCategoryOpen(false)}
      />
    </div>
  );
}
