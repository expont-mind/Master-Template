"use client";

import Link from "next/link";

import { Device, LocationProfile, Logout, PhoneCall, Slash } from "@/components/svg";
import { PrimaryMediumSm } from "@/components/ui/typography";
import { stripPhonePrefix } from "@/lib/utils/formatters";

import type { SideMenu } from "./ProfileSidebar";
import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

// 20x20 arrow right icon
const ArrowRight20 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M7.5 5C7.5 5 12.5 8.68245 12.5 10.0001C12.5 11.3176 7.5 15 7.5 15"
      stroke="#64748B"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface SettingsContentProps {
  user: UserRow | null;
  defaultAddress: AddressRow | null;
  onNavigate: (menu: SideMenu) => void;
}

export const SettingsContent = ({ user, defaultAddress, onNavigate }: SettingsContentProps) => {
  const hasPhone = !!user?.primary_phone;

  const addressSubtitle = (() => {
    if (!defaultAddress) return "Хаяг оруулаагүй";
    const parts = [
      defaultAddress.district,
      defaultAddress.sub_district,
      defaultAddress.detail,
      defaultAddress.city,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Хаяг оруулаагүй";
  })();

  const phoneSubtitle = user?.primary_phone
    ? stripPhonePrefix(user.primary_phone)
    : "Баталгаажуулаагүй";

  const items: {
    id: SideMenu;
    icon: React.ReactNode;
    label: string;
    subtitle: string;
    subtitleColor?: string;
    showArrow: boolean;
    showBorder: boolean;
  }[] = [
    {
      id: "address",
      icon: <LocationProfile />,
      label: "Миний хаяг",
      subtitle: addressSubtitle,
      showArrow: true,
      showBorder: true,
    },
    {
      id: "phone",
      icon: <PhoneCall />,
      label: "Баталгаат утас",
      subtitle: phoneSubtitle,
      subtitleColor: !hasPhone ? "#F43F5E" : undefined,
      showArrow: true,
      showBorder: true,
    },
    {
      id: "connections",
      icon: <Device />,
      label: "Бусад холболт",
      subtitle: "Apple, Google, Facebook",
      showArrow: true,
      showBorder: true,
    },
    {
      id: "logout",
      icon: <Logout />,
      label: "Гарах",
      subtitle: "",
      showArrow: false,
      showBorder: false,
    },
  ];

  return (
    <div className="flex flex-col gap-4 md:gap-2">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 md:hidden px-px">
          <Link
            href="/profile"
            className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
          >
            Профайл
          </Link>
          <Slash />
          <p className="text-slate-950 text-sm font-normal font-manrope">Тохиргоо</p>
        </div>

        <p className="px-0 md:px-0.5 pb-0 md:pb-3 text-text-primary font-bold md:font-semibold text-2xl md:text-xl font-manrope">
          Тохиргоо
        </p>
      </div>

      {/* Menu items — Flutter ProfileMenuItem style */}
      <div className="flex flex-col">
        {items.map((item) =>
          item.id === "logout" ? (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-4 pt-2 pb-1 pr-3 pl-0.5 cursor-pointer transition-colors hover:bg-surface rounded-lg"
            >
              <div className="shrink-0 text-text-primary">{item.icon}</div>
              <div className="flex-1 flex items-center py-3.5 min-w-0">
                <PrimaryMediumSm>{item.label}</PrimaryMediumSm>
              </div>
            </button>
          ) : (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-4 px-0.5 cursor-pointer transition-colors hover:bg-surface rounded-lg"
            >
              <div className="shrink-0 text-text-primary">{item.icon}</div>
              <div
                className={`flex-1 flex items-center gap-4 py-3.5 min-w-0 ${
                  item.showBorder ? "border-b border-border" : ""
                }`}
              >
                <div className="flex-1 flex flex-col gap-0.5 items-start min-w-0">
                  <PrimaryMediumSm>{item.label}</PrimaryMediumSm>
                  <p className="text-text-secondary font-normal text-sm font-manrope truncate w-full text-left">
                    {item.subtitle}
                  </p>
                </div>
                {item.showArrow && (
                  <div className="shrink-0">
                    <ArrowRight20 />
                  </div>
                )}
              </div>
            </button>
          ),
        )}
      </div>
    </div>
  );
};
