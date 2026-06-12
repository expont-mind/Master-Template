"use client";

import { Heart, HelpCircle, Settings } from "@/components/svg";
import { PrimaryMediumSm } from "@/components/ui/typography";

import { ArrowRight20 } from "./_ArrowRight20";
import { type SideMenu } from "./_types";

interface MobileMenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  withBorder: boolean;
  onClick: () => void;
}

function MobileMenuItem({ icon, title, subtitle, withBorder, onClick }: MobileMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 px-0.5 cursor-pointer"
    >
      <div className="shrink-0">{icon}</div>
      <div
        className={`flex-1 flex items-center gap-4 justify-between py-3.5 ${
          withBorder ? "border-b border-border" : ""
        }`}
      >
        <div className="flex flex-col items-start gap-0.5 min-w-0">
          <PrimaryMediumSm>{title}</PrimaryMediumSm>
          <p className="text-text-secondary font-normal text-sm font-manrope line-clamp-1 w-full text-left">
            {subtitle}
          </p>
        </div>
        <div className="shrink-0">
          <ArrowRight20 />
        </div>
      </div>
    </button>
  );
}

interface MobileMenuProps {
  onMenuChange: (menu: SideMenu) => void;
  wishlistCount: number;
}

export function MobileMenu({ onMenuChange, wishlistCount }: MobileMenuProps) {
  return (
    <div className="flex flex-col">
      <MobileMenuItem
        icon={<Heart />}
        title="Хадгалсан"
        subtitle={
          wishlistCount > 0 ? `${wishlistCount} бараа хадгалсан` : "Хадгалсан бараа байхгүй"
        }
        withBorder
        onClick={() => onMenuChange("wishlist")}
      />
      <MobileMenuItem
        icon={<Settings />}
        title="Тохиргоо"
        subtitle="Бусад холболт, баталгаат утас"
        withBorder
        onClick={() => onMenuChange("settings")}
      />
      <MobileMenuItem
        icon={<HelpCircle />}
        title="Тусламж"
        subtitle="Салбар, түгээмэл асуулт, үйлчилгээний нөхцөл"
        withBorder={false}
        onClick={() => onMenuChange("help")}
      />
    </div>
  );
}
