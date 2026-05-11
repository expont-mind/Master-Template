"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { useUIStore } from "@/stores/ui-store";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { ROUTES } from "@/lib/utils/constants";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  Menu,
  ChevronDown,
  Location,
  Monpang,
  Bell,
  SearchHeader,
  MPointBadgeBlack,
} from "../svg";
import { CategoryMenu } from "./CategoryMenu";
import { MobileCategoryMenu } from "./MobileCategoryMenu";
import { SearchModal } from "../search/SearchModal";
import { NotificationPanel } from "../notification";
import { PointGiftModal } from "../profile/PointGiftModal";
import {
  useUnreadNotificationCount,
  useRealtimeNotifications,
} from "@/lib/hooks/useNotifications";
import {
  useDefaultAddress,
  useAllAddresses,
  useSetDefaultAddress,
} from "@/lib/hooks/useDefaultAddress";
import { AddressSelectModal } from "@/components/checkout/AddressSelectModal";

function HeaderSearchLabel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = pathname === ROUTES.SEARCH ? (searchParams.get("q") ?? "") : "";
  return (
    <span
      className={`text-sm font-normal font-manrope truncate ${
        q ? "text-[#020617]" : "text-[#64748B]"
      }`}
    >
      {q || "Хайх"}
    </span>
  );
}

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
    pointGiftModal,
    openPointGiftModal,
    closePointGiftModal,
  } = useUIStore();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = useRef(0);

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
    setHasMounted(true);
  }, []);

  // Point balance for header display
  const [pointBalance, setPointBalance] = useState<number | null>(null);
  useEffect(() => {
    if (!user) {
      setPointBalance(null);
      return;
    }
    const supabase = createClient();
    (supabase as any)
      .from("point_transactions")
      .select("amount")
      .eq("user_id", user.id)
      .then(({ data }: { data: { amount: number }[] | null }) => {
        if (data) {
          setPointBalance(data.reduce((sum, t) => sum + t.amount, 0));
        }
      });
  }, [user]);

  // Get user's default address
  const { data: defaultAddress } = useDefaultAddress(user?.id);
  const { data: allAddresses = [] } = useAllAddresses(user?.id);
  const setDefaultAddress = useSetDefaultAddress(user?.id);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Hide top header on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 60) {
        setShowTopHeader(false);
      } else {
        setShowTopHeader(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleProfileClick = useCallback(() => {
    if (user) {
      router.push("/profile");
    } else {
      openLogin("/profile");
    }
  }, [user, router, openLogin]);

  // Close category dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    if (isCategoryOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCategoryOpen]);

  return (
    <div ref={headerRef}>
      <div className="fixed top-0 left-0 right-0 z-100 bg-white flex flex-col">
        <header
          className={`w-full bg-white flex flex-col items-center overflow-hidden transition-[max-height] duration-300 ${showTopHeader ? "max-h-20" : "max-h-0"}`}
        >
          <div className="pt-1 md:pt-4 pb-0 md:pb-3 px-4 xl:px-0 flex items-center justify-between max-w-[1064px] w-full gap-3">
            {/* Search trigger - opens modal (hidden on mobile) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="relative max-w-[280px] flex-1 cursor-pointer hidden md:block"
            >
              <div className="p-1 flex items-center gap-1 w-full border border-[#E2E8F0] rounded-lg hover:border-[#CBD5E1] transition-colors">
                <div className="p-1.5">
                  <Search />
                </div>
                <Suspense
                  fallback={
                    <span className="text-[#64748B] text-sm font-normal font-manrope">
                      Хайх
                    </span>
                  }
                >
                  <HeaderSearchLabel />
                </Suspense>
              </div>
            </button>

            <Link href="/" className="shrink-0">
              <Monpang />
            </Link>

            <div className="flex-1 max-w-[280px] flex justify-end items-center gap-1 md:gap-2">
              {/* Mobile search icon */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 cursor-pointer md:hidden"
                aria-label="Хайх"
              >
                <SearchHeader />
              </button>
              <Link
                href={ROUTES.WISHLIST}
                className="p-2 relative hidden md:block"
              >
                <Heart />
                {hasMounted && wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-semibold text-white bg-[#F43F5E] rounded-full">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>
              <Link href={ROUTES.CART} className="p-2 relative">
                <ShoppingCart />
                {hasMounted && cartCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-semibold text-white bg-[#F43F5E] rounded-full">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
              <div ref={notificationRef} className="relative">
                <button
                  onClick={toggleNotification}
                  className="p-2 cursor-pointer relative"
                  aria-label="Мэдэгдэл"
                >
                  <Bell />
                  {unreadCount && unreadCount > 0 ? (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-semibold text-white bg-[#F43F5E] rounded-full">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </button>
              </div>

              <div className="pl-[5px]">
                <button
                  onClick={handleProfileClick}
                  className="flex items-center gap-1 pl-1.5 pr-2.5 py-[5px] rounded-full border border-[#020617] cursor-pointer"
                >
                  <User />
                  <div className="flex items-center gap-[3px]">
                    <p className="text-[#020617] font-normal text-[15px] font-manrope">
                      {pointBalance?.toLocaleString() || 0}
                    </p>
                    <div className="flex items-center gap-px">
                      <MPointBadgeBlack />
                      <span className="text-[#020617] font-normal text-base font-manrope">
                        /
                      </span>
                      <span className="text-[#020617] font-normal text-base font-manrope">
                        ₮
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Bottom nav */}
        <nav className="w-full bg-white flex justify-center border-b border-[#E2E8F0]">
          <div className="w-full max-w-[1064px] px-0 flex justify-between items-center">
            <div className="flex items-center gap-0 md:gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              {/* Mobile: Toggle mobile category menu */}
              <button
                onClick={() => setIsMobileCategoryOpen((prev) => !prev)}
                className={`md:hidden flex items-center gap-[10px] px-3 py-3 cursor-pointer border-b-2 transition-colors ${
                  pathname.startsWith(ROUTES.PRODUCTS)
                    ? "border-[#020617]"
                    : "border-transparent"
                }`}
              >
                <Menu
                  color={
                    pathname.startsWith(ROUTES.PRODUCTS) ? "#020617" : "#64748B"
                  }
                />
                <p
                  className={`font-medium hover:text-[#020617] duration-200 text-[15px] font-manrope transition-colors ${
                    pathname.startsWith(ROUTES.PRODUCTS)
                      ? "text-[#020617]"
                      : "text-[#64748B]"
                  }`}
                >
                  Категори
                </p>
              </button>

              {/* Desktop: Hover dropdown */}
              <button
                onClick={() => {
                  setIsCategoryOpen(false);
                  router.push(ROUTES.PRODUCTS);
                }}
                onMouseEnter={() => {
                  if (closeTimeoutRef.current)
                    clearTimeout(closeTimeoutRef.current);
                  setIsCategoryOpen(true);
                }}
                onMouseLeave={() => {
                  closeTimeoutRef.current = setTimeout(
                    () => setIsCategoryOpen(false),
                    200,
                  );
                }}
                className={`hidden md:flex items-center gap-[10px] px-0 pt-[14px] pb-[20px] cursor-pointer border-b-2 transition-colors ${
                  pathname.startsWith(ROUTES.PRODUCTS)
                    ? "border-[#020617]"
                    : "border-transparent"
                }`}
              >
                <Menu
                  color={
                    pathname.startsWith(ROUTES.PRODUCTS) ? "#020617" : "#64748B"
                  }
                />
                <p
                  className={`font-medium hover:text-[#020617] duration-200 text-[15px] font-manrope transition-colors ${
                    pathname.startsWith(ROUTES.PRODUCTS)
                      ? "text-[#020617]"
                      : "text-[#64748B]"
                  }`}
                >
                  Категори
                </p>
              </button>

              <div className="px-2">
                <div className="h-[30px] w-px bg-[#E2E8F0]"></div>
              </div>

              <Link
                href={ROUTES.BRANDS}
                className={`font-medium hover:text-[#020617] duration-200 text-[15px] font-manrope px-3 py-3 md:pt-4 md:pb-5 whitespace-nowrap border-b-2 transition-colors ${
                  pathname === ROUTES.BRANDS
                    ? "text-[#020617] border-[#020617]"
                    : "text-[#64748B] border-transparent"
                }`}
              >
                Брэнд
              </Link>
              <Link
                href={ROUTES.BEST_SELLERS}
                className={`font-medium hover:text-[#020617] duration-200 text-[15px] font-manrope px-3 py-3 md:pt-4 md:pb-5 whitespace-nowrap border-b-2 transition-colors ${
                  pathname === ROUTES.BEST_SELLERS
                    ? "text-[#020617] border-[#020617]"
                    : "text-[#64748B] border-transparent"
                }`}
              >
                Best
              </Link>
              <Link
                href={ROUTES.NEW_ARRIVALS}
                className={`font-medium hover:text-[#020617] duration-200 text-[15px] font-manrope px-3 py-3 md:pt-4 md:pb-5 whitespace-nowrap border-b-2 transition-colors ${
                  pathname === ROUTES.NEW_ARRIVALS
                    ? "text-[#020617] border-[#020617]"
                    : "text-[#64748B] border-transparent"
                }`}
              >
                New
              </Link>
            </div>

            <div className="hidden md:block shrink-0 pt-[6px] pb-2.5">
              <div
                onClick={() => setIsAddressModalOpen(true)}
                className="flex items-center gap-1 py-2.5 px-1.5 cursor-pointer group"
              >
                <div className="flex items-center gap-1.5">
                  <Location />
                  <p className="text-[#64748B] font-medium text-[15px] font-manrope group-hover:text-[#020617] transition-colors duration-200 truncate max-w-[146px]">
                    {defaultAddress
                      ? [
                          defaultAddress.district,
                          defaultAddress.sub_district,
                          defaultAddress.detail,
                        ]
                          .filter(Boolean)
                          .join(", ")
                      : "Хүргүүлэх хаяг"}
                  </p>
                </div>
                <div className={`w-4 h-4 flex items-center justify-center`}>
                  <ChevronDown />
                </div>
              </div>
            </div>
          </div>

          {/* Category Dropdown - smooth slide down */}
          <div
            className={`hidden md:block w-full bg-white shadow-sm overflow-hidden transition-all duration-300 ease-out absolute top-full left-0 right-0 ${isCategoryOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
            onMouseEnter={() => {
              if (closeTimeoutRef.current)
                clearTimeout(closeTimeoutRef.current);
              setIsCategoryOpen(true);
            }}
            onMouseLeave={() => {
              closeTimeoutRef.current = setTimeout(
                () => setIsCategoryOpen(false),
                200,
              );
            }}
          >
            <div className="max-w-[1064px] mx-auto">
              <CategoryMenu />
            </div>
          </div>
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

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Address Select Modal */}
      <AddressSelectModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        addresses={allAddresses}
        selectedAddressId={defaultAddress?.id || null}
        onSelect={(address) => {
          setDefaultAddress.mutate(address.id);
        }}
        onEdit={(address) => {
          router.push(`/profile?tab=address&action=edit&id=${address.id}`);
        }}
        onAddNew={() => {
          router.push("/profile?tab=address&action=new");
        }}
      />

      {/* Mobile Category Menu */}
      <MobileCategoryMenu
        isOpen={isMobileCategoryOpen}
        onClose={() => setIsMobileCategoryOpen(false)}
      />

      {/* Point Gift Modal */}
      {pointGiftModal && (
        <PointGiftModal
          isOpen={pointGiftModal.isOpen}
          onClose={closePointGiftModal}
          onViewBalance={() => {
            closePointGiftModal();
            router.push("/profile?tab=point");
          }}
          amount={pointGiftModal.amount}
          description={pointGiftModal.description}
        />
      )}
    </div>
  );
}
