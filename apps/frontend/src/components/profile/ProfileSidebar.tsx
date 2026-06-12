"use client";

import { DesktopMenu } from "./_sidebar/_DesktopMenu";
import { MobileMenu } from "./_sidebar/_MobileMenu";
import { getDisplayName, getRegisteredLabel, type SideMenu } from "./_sidebar/_types";
import { UserInfoCard } from "./_sidebar/_UserInfoCard";

import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

export { type SideMenu };

interface ProfileSidebarProps {
  activeMenu: SideMenu;
  onMenuChange: (menu: SideMenu) => void;
  user: UserRow | null;
  defaultAddress: AddressRow | null;
  wishlistCount?: number;
  couponCount?: number;
  pointBalance?: number;
}

export const ProfileSidebar = ({
  activeMenu,
  onMenuChange,
  user,
  wishlistCount = 0,
  couponCount = 0,
  pointBalance = 0,
}: ProfileSidebarProps) => {
  const displayName = getDisplayName(user);
  const registeredDate = getRegisteredLabel(user?.created_at);

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden w-full flex flex-col gap-4 pt-3 pb-4">
        <UserInfoCard
          displayName={displayName}
          registeredDate={registeredDate}
          pointBalance={pointBalance}
          couponCount={couponCount}
          onMenuChange={onMenuChange}
          nameClassName="text-text-primary font-medium text-sm font-manrope truncate w-full text-left"
        />
        <MobileMenu onMenuChange={onMenuChange} wishlistCount={wishlistCount} />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-col w-[280px] shrink-0 gap-4 pb-3">
        <UserInfoCard
          displayName={displayName}
          registeredDate={registeredDate}
          pointBalance={pointBalance}
          couponCount={couponCount}
          onMenuChange={onMenuChange}
          nameClassName="text-text-primary font-semibold text-sm font-manrope truncate w-full text-left"
        />
        <DesktopMenu activeMenu={activeMenu} onMenuChange={onMenuChange} />
      </div>
    </>
  );
};
