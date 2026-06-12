"use client";

import { SITE } from "@repo/config-site";
import Link from "next/link";

import { Bell, Heart, SearchHeader, ShoppingCart } from "@/components/svg";
import { ROUTES } from "@/lib/utils/constants";

import { HeaderUserButton } from "./HeaderUserButton";

interface HeaderActionsProps {
  hasMounted: boolean;
  cartCount: number;
  wishlistCount: number;
  unreadCount: number | undefined;
  pointBalance: number | null;
  notificationRef: React.RefObject<HTMLDivElement | null>;
  onMobileSearchOpen: () => void;
  onToggleNotification: () => void;
  onProfileClick: () => void;
}

export function HeaderActions({
  hasMounted,
  cartCount,
  wishlistCount,
  unreadCount,
  pointBalance,
  notificationRef,
  onMobileSearchOpen,
  onToggleNotification,
  onProfileClick,
}: HeaderActionsProps) {
  return (
    <div className="flex-1 max-w-[280px] flex justify-end items-center gap-1 md:gap-2">
      {/* Mobile search icon */}
      <button
        onClick={onMobileSearchOpen}
        className="p-2 cursor-pointer md:hidden"
        aria-label="Хайх"
      >
        <SearchHeader />
      </button>
      {SITE.features.wishlist && (
        <Link href={ROUTES.WISHLIST} className="p-2 relative hidden md:block">
          <Heart />
          {hasMounted && wishlistCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-semibold text-white bg-brand-primary rounded-full">
              {wishlistCount > 99 ? "99+" : wishlistCount}
            </span>
          )}
        </Link>
      )}
      <Link href={ROUTES.CART} className="p-2 relative">
        <ShoppingCart />
        {hasMounted && cartCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-semibold text-white bg-brand-primary rounded-full">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </Link>
      {SITE.features.notifications && (
        <div ref={notificationRef} className="relative">
          <button
            onClick={onToggleNotification}
            className="p-2 cursor-pointer relative"
            aria-label="Мэдэгдэл"
          >
            <Bell />
            {unreadCount && unreadCount > 0 ? (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-semibold text-white bg-brand-primary rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </button>
        </div>
      )}

      <HeaderUserButton pointBalance={pointBalance} onClick={onProfileClick} />
    </div>
  );
}
