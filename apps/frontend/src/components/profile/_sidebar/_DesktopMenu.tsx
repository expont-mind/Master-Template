"use client";

import { Delivery, HelpCircle, Settings } from "@/components/svg";
import { PrimaryMediumSm } from "@/components/ui/typography";

import { ArrowRight20 } from "./_ArrowRight20";
import { type SideMenu } from "./_types";

interface DesktopMenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isActive: boolean;
  onClick: () => void;
}

function DesktopMenuItem({ icon, title, subtitle, isActive, onClick }: DesktopMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 cursor-pointer transition-colors hover:bg-surface rounded-lg ${
        isActive ? "bg-surface" : ""
      }`}
    >
      <div className="shrink-0 text-text-primary">{icon}</div>
      <div className="flex-1 min-w-0 flex flex-col items-start gap-0.5 py-3.5">
        <PrimaryMediumSm>{title}</PrimaryMediumSm>
        <p className="text-text-secondary font-normal text-sm font-manrope truncate w-full text-left">
          {subtitle}
        </p>
      </div>
      <ArrowRight20 />
    </button>
  );
}

interface DesktopMenuProps {
  activeMenu: SideMenu;
  onMenuChange: (menu: SideMenu) => void;
}

const SETTINGS_SUB_MENUS: SideMenu[] = ["settings", "address", "phone", "connections"];

export function DesktopMenu({ activeMenu, onMenuChange }: DesktopMenuProps) {
  const isSettingsActive = SETTINGS_SUB_MENUS.includes(activeMenu);
  return (
    <div className="flex flex-col">
      <DesktopMenuItem
        icon={<Delivery />}
        title="Миний захиалгууд"
        subtitle="Захиалсан, хүргэгдсэн, цуцлагдсан"
        isActive={activeMenu === "orders"}
        onClick={() => onMenuChange("orders")}
      />
      <DesktopMenuItem
        icon={<Settings />}
        title="Тохиргоо"
        subtitle="Хаяг, бусад холболт, баталгаат утас"
        isActive={isSettingsActive}
        onClick={() => onMenuChange("settings")}
      />
      <DesktopMenuItem
        icon={<HelpCircle />}
        title="Тусламж"
        subtitle="Салбар, түгээмэл асуулт, үйлчилгээний нөхцөл"
        isActive={activeMenu === "help"}
        onClick={() => onMenuChange("help")}
      />
    </div>
  );
}
