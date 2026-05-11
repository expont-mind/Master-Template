"use client";

import type { Database } from "@/types/database";
import {
  Delivery,
  Heart,
  HelpCircle,
  MPointSmall,
  Settings,
  UserCircle,
} from "../svg";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

export type SideMenu =
  | "orders"
  | "address"
  | "phone"
  | "point"
  | "wishlist"
  | "coupon"
  | "personal"
  | "connections"
  | "settings"
  | "help"
  | "logout";

interface ProfileSidebarProps {
  activeMenu: SideMenu;
  onMenuChange: (menu: SideMenu) => void;
  user: UserRow | null;
  defaultAddress: AddressRow | null;
  wishlistCount?: number;
  couponCount?: number;
  pointBalance?: number;
}

// 20x20 arrow right icon (matching Flutter HugeIcons.strokeRoundedArrowRight01)
const ArrowRight20 = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
  >
    <path
      d="M7.5 5C7.5 5 12.5 8.68245 12.5 10.0001C12.5 11.3176 7.5 15 7.5 15"
      stroke="#94A3B8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function formatRegisteredDate(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export const ProfileSidebar = ({
  activeMenu,
  onMenuChange,
  user,
  wishlistCount = 0,
  couponCount = 0,
  pointBalance = 0,
}: ProfileSidebarProps) => {
  const displayName =
    user?.first_name || user?.last_name
      ? `${user.last_name ?? ""} ${user.first_name ?? ""}`.trim()
      : "Нэр тохируулах";

  const registeredDate = user?.created_at
    ? `${formatRegisteredDate(user.created_at)}-нд бүртгэгдсэн`
    : null;

  // Determine if settings or help is active (including sub-menus that belong to settings)
  const isSettingsActive =
    activeMenu === "settings" ||
    activeMenu === "address" ||
    activeMenu === "phone" ||
    activeMenu === "connections";

  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden w-full flex flex-col gap-4 pt-3 pb-4">
        {/* User info card */}
        <div
          className="bg-white flex flex-col gap-3 rounded-lg border border-[#E2E8F0] overflow-hidden px-4 pt-4 pb-3"
          style={{ boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)" }}
        >
          {/* User info row */}
          <button
            onClick={() => onMenuChange("personal")}
            className="w-full flex items-center gap-4 cursor-pointer"
          >
            <div className="shrink-0 w-14 h-14 rounded-full bg-[#F8FAFC] flex items-center justify-center">
              <UserCircle />
            </div>
            <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
              <p className="text-[#020617] font-medium text-sm font-manrope truncate w-full text-left">
                {displayName}
              </p>
              {registeredDate && (
                <p className="text-[#94A3B8] font-normal text-xs font-manrope w-full text-left">
                  {registeredDate}
                </p>
              )}
            </div>
            <div className="shrink-0">
              <ArrowRight20 />
            </div>
          </button>

          <div className="flex flex-col">
            {/* Divider */}
            <div className="pt-2">
              <div className="w-full h-px bg-[#E2E8F0]" />
            </div>

            {/* Point & Coupon side-by-side */}
            <div className="flex gap-2">
              {/* Point card */}
              <button
                onClick={() => onMenuChange("point")}
                className="flex-1 flex pl-1 pt-4 pb-2 justify-between cursor-pointer"
              >
                <div className="flex-1 flex flex-col items-start">
                  <div className="flex items-center gap-0.5">
                    <p className="text-[#020617] font-semibold text-sm font-manrope">
                      {pointBalance.toLocaleString()}
                    </p>
                    <div className="flex items-center h-fit">
                      <span className="pb-[1.4px]">
                        <MPointSmall />
                      </span>
                      <p className="text-[#020617] font-semibold text-sm font-manrope">
                        /<span className="pl-[1.5px] pb-px">₮</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-[#94A3B8] text-left font-normal text-xs font-manrope pl-px">
                    Monpang point
                  </p>
                  <p className="text-teal-500 text-left font-normal text-[10px] font-manrope px-px leading-3.5">
                    1point = 1төг
                  </p>
                </div>
                <div className="shrink-0 pt-3">
                  <ArrowRight20 />
                </div>
              </button>

              {/* Vertical divider */}
              <div className="px-2">
                <div className="w-px h-full bg-[#E2E8F0]" />
              </div>

              {/* Coupon card */}
              <button
                onClick={() => onMenuChange("coupon")}
                className="flex-1 flex pl-1 pt-4 pb-2 justify-between cursor-pointer"
              >
                <div className="flex-1 flex flex-col items-start">
                  <div className="flex items-center gap-0.5">
                    <p className="text-[#020617] font-semibold text-sm font-manrope">
                      {couponCount}ш
                    </p>
                  </div>
                  <p className="text-[#94A3B8] text-left font-normal text-xs font-manrope pl-px">
                    Миний купон
                  </p>
                </div>
                <div className="shrink-0 pt-3">
                  <ArrowRight20 />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="flex flex-col">
          {/* Wishlist */}
          <button
            onClick={() => onMenuChange("wishlist")}
            className="w-full flex items-center gap-4 px-0.5 cursor-pointer"
          >
            <div className="shrink-0">
              <Heart />
            </div>
            <div className="flex-1 flex items-center gap-4 justify-between py-3.5 border-b border-[#E2E8F0]">
              <div className="flex flex-col items-start gap-0.5 min-w-0">
                <p className="text-[#020617] font-medium text-sm font-manrope">
                  Хадгалсан
                </p>
                <p className="text-[#64748B] font-normal text-sm font-manrope line-clamp-1 w-full text-left">
                  {wishlistCount > 0
                    ? `${wishlistCount} бараа хадгалсан`
                    : "Хадгалсан бараа байхгүй"}
                </p>
              </div>
              <div className="shrink-0 ">
                <ArrowRight20 />
              </div>
            </div>
          </button>

          {/* Settings */}
          <button
            onClick={() => onMenuChange("settings")}
            className="w-full flex items-center gap-4 px-0.5 cursor-pointer"
          >
            <div className="shrink-0">
              <Settings />
            </div>
            <div className="flex-1 flex items-center gap-4 justify-between py-3.5 border-b border-[#E2E8F0]">
              <div className="flex flex-col items-start gap-0.5 min-w-0">
                <p className="text-[#020617] font-medium text-sm font-manrope">
                  Тохиргоо
                </p>
                <p className="text-[#64748B] font-normal text-sm font-manrope line-clamp-1 w-full text-left">
                  Бусад холболт, баталгаат утас
                </p>
              </div>
              <div className="shrink-0 ">
                <ArrowRight20 />
              </div>
            </div>
          </button>

          {/* Help */}
          <button
            onClick={() => onMenuChange("help")}
            className="w-full flex items-center gap-4 px-0.5 cursor-pointer"
          >
            <div className="shrink-0">
              <HelpCircle />
            </div>
            <div className="flex-1 flex items-center gap-4 justify-between py-3.5">
              <div className="flex flex-col items-start gap-0.5 min-w-0">
                <p className="text-[#020617] font-medium text-sm font-manrope">
                  Тусламж
                </p>
                <p className="text-[#64748B] font-normal text-sm font-manrope line-clamp-1 w-full text-left">
                  Салбар, түгээмэл асуулт, үйлчилгээний нөхцөл
                </p>
              </div>
              <div className="shrink-0 ">
                <ArrowRight20 />
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Desktop Layout — Flutter-style design */}
      <div className="hidden lg:flex flex-col w-[280px] shrink-0 gap-4 pb-3">
        {/* ── User info card with Point / Coupon ── */}
        <div
          className="bg-white rounded-lg flex flex-col gap-3 px-4 pt-4 pb-3 border border-[#E2E8F0] overflow-hidden"
          style={{ boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)" }}
        >
          {/* User info row */}
          <button
            onClick={() => onMenuChange("personal")}
            className="w-full flex items-center gap-4 cursor-pointer"
          >
            {/* Avatar */}
            <div className="shrink-0 w-14 h-14 rounded-full bg-[#F8FAFC] flex items-center justify-center">
              <UserCircle />
            </div>

            <div className="flex items-center justify-between flex-1">
              {/* Name & registration date */}
              <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
                <p className="text-[#020617] font-semibold text-sm font-manrope truncate w-full text-left">
                  {displayName}
                </p>
                {registeredDate && (
                  <p className="text-[#94A3B8] font-normal text-start text-xs font-manrope w-full">
                    {registeredDate}
                  </p>
                )}
              </div>
              {/* Arrow */}
              <div className="shrink-0">
                <ArrowRight20 />
              </div>
            </div>
          </button>

          <div className="flex flex-col">
            {/* Horizontal divider */}
            <div className="pt-2">
              <div className="w-full h-px bg-[#E2E8F0]" />
            </div>

            {/* Point & Coupon side-by-side */}
            <div className="flex gap-2">
              {/* Point card */}
              <button
                onClick={() => onMenuChange("point")}
                className="flex-1 flex pl-1 pt-4 pb-2 justify-between cursor-pointer"
              >
                <div className="flex-1 flex flex-col items-start">
                  <div className="flex items-center gap-0.5">
                    <p className="text-[#020617] font-semibold text-sm font-manrope">
                      {pointBalance.toLocaleString()}
                    </p>
                    <div className="flex items-center h-fit">
                      <span className="pb-[1.4px]">
                        <MPointSmall />
                      </span>
                      <p className="text-[#020617] font-semibold text-sm font-manrope">
                        /<span className="pl-[1.5px] pb-px">₮</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-[#94A3B8] text-left font-normal text-xs font-manrope pl-px">
                    Monpang point
                  </p>
                  <p className="text-teal-500 text-left font-normal text-[10px] font-manrope px-px leading-3.5">
                    1point = 1төг
                  </p>
                </div>
                <div className="shrink-0 pt-3">
                  <ArrowRight20 />
                </div>
              </button>

              {/* Vertical divider */}
              <div className="px-2">
                <div className="w-px h-full bg-[#E2E8F0]" />
              </div>

              {/* Coupon card */}
              <button
                onClick={() => onMenuChange("coupon")}
                className="flex-1 flex pl-1 pt-4 pb-2 justify-between cursor-pointer"
              >
                <div className="flex-1 flex flex-col items-start">
                  <div className="flex items-center gap-0.5">
                    <p className="text-[#020617] font-semibold text-sm font-manrope">
                      {couponCount}ш
                    </p>
                  </div>
                  <p className="text-[#94A3B8] text-left font-normal text-xs font-manrope pl-px">
                    Миний купон
                  </p>
                </div>
                <div className="shrink-0 pt-3">
                  <ArrowRight20 />
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          {/* Миний захиалгууд */}
          <button
            onClick={() => onMenuChange("orders")}
            className={`w-full flex items-center gap-4 px-4 cursor-pointer transition-colors hover:bg-[#F8FAFC] rounded-lg ${
              activeMenu === "orders" ? "bg-[#F8FAFC]" : ""
            }`}
          >
            <div className="shrink-0 text-[#020617]">
              <Delivery />
            </div>
            <div className="flex-1 min-w-0 flex flex-col items-start gap-0.5 py-3.5">
              <p className="text-[#020617] font-medium text-sm font-manrope">
                Миний захиалгууд
              </p>
              <p className="text-[#64748B] font-normal text-sm font-manrope truncate w-full text-left">
                Захиалсан, хүргэгдсэн, цуцлагдсан
              </p>
            </div>

            <ArrowRight20 />
          </button>

          {/* Тохиргоо (Settings) */}
          <button
            onClick={() => onMenuChange("settings")}
            className={`w-full flex items-center gap-4 px-4 cursor-pointer transition-colors hover:bg-[#F8FAFC] rounded-lg ${
              isSettingsActive ? "bg-[#F8FAFC]" : ""
            }`}
          >
            <div className="shrink-0 text-[#020617]">
              <Settings />
            </div>
            <div className="flex-1 min-w-0 flex flex-col items-start gap-0.5 py-3.5">
              <p className="text-[#020617] font-medium text-sm font-manrope">
                Тохиргоо
              </p>
              <p className="text-[#64748B] font-normal text-sm font-manrope truncate w-full text-left">
                Хаяг, бусад холболт, баталгаат утас
              </p>
            </div>

            <ArrowRight20 />
          </button>

          {/* Тусламж (Help) */}
          <button
            onClick={() => onMenuChange("help")}
            className={`w-full flex items-center gap-4 px-4 cursor-pointer transition-colors hover:bg-[#F8FAFC] rounded-lg ${
              activeMenu === "help" ? "bg-[#F8FAFC]" : ""
            }`}
          >
            <div className="shrink-0 text-[#020617]">
              <HelpCircle />
            </div>
            <div className="flex-1 min-w-0 flex flex-col items-start gap-0.5 py-3.5">
              <p className="text-[#020617] font-medium text-sm font-manrope">
                Тусламж
              </p>
              <p className="text-[#64748B] font-normal text-sm font-manrope truncate w-full text-left">
                Салбар, түгээмэл асуулт, үйлчилгээний нөхцөл
              </p>
            </div>

            <ArrowRight20 />
          </button>
        </div>
      </div>
    </>
  );
};
