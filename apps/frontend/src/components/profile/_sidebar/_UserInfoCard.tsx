"use client";

import { SITE } from "@repo/config-site";

import { MPointSmall, UserCircle } from "@/components/svg";
import { PrimarySemiboldSm } from "@/components/ui/typography";
import { BRAND } from "@/lib/utils/brand-config";

import { ArrowRight20 } from "./_ArrowRight20";
import { type SideMenu } from "./_types";

interface UserInfoCardProps {
  displayName: string;
  registeredDate: string | null;
  pointBalance: number;
  couponCount: number;
  onMenuChange: (menu: SideMenu) => void;
  nameClassName: string;
}

function PointCard({
  pointBalance,
  onMenuChange,
}: {
  pointBalance: number;
  onMenuChange: (menu: SideMenu) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onMenuChange("point")}
      className="flex-1 flex pl-1 pt-4 pb-2 justify-between cursor-pointer"
    >
      <div className="flex-1 flex flex-col items-start">
        <div className="flex items-center gap-0.5">
          <PrimarySemiboldSm>{pointBalance.toLocaleString()}</PrimarySemiboldSm>
          <div className="flex items-center h-fit">
            <span className="pb-[1.4px]">
              <MPointSmall />
            </span>
            <PrimarySemiboldSm>
              /<span className="pl-[1.5px] pb-px">₮</span>
            </PrimarySemiboldSm>
          </div>
        </div>
        <p className="text-text-muted text-left font-normal text-xs font-manrope pl-px">
          {BRAND.name} point
        </p>
        <p className="text-teal-500 text-left font-normal text-[10px] font-manrope px-px leading-3.5">
          1point = 1төг
        </p>
      </div>
      <div className="shrink-0 pt-3">
        <ArrowRight20 />
      </div>
    </button>
  );
}

function CouponCard({
  couponCount,
  onMenuChange,
}: {
  couponCount: number;
  onMenuChange: (menu: SideMenu) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onMenuChange("coupon")}
      className="flex-1 flex pl-1 pt-4 pb-2 justify-between cursor-pointer"
    >
      <div className="flex-1 flex flex-col items-start">
        <div className="flex items-center gap-0.5">
          <PrimarySemiboldSm>{couponCount}ш</PrimarySemiboldSm>
        </div>
        <p className="text-text-muted text-left font-normal text-xs font-manrope pl-px">
          Миний купон
        </p>
      </div>
      <div className="shrink-0 pt-3">
        <ArrowRight20 />
      </div>
    </button>
  );
}

export function UserInfoCard({
  displayName,
  registeredDate,
  pointBalance,
  couponCount,
  onMenuChange,
  nameClassName,
}: UserInfoCardProps) {
  return (
    <div
      className="bg-white flex flex-col gap-3 rounded-lg border border-border overflow-hidden px-4 pt-4 pb-3"
      style={{ boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)" }}
    >
      <button
        type="button"
        onClick={() => onMenuChange("personal")}
        className="w-full flex items-center gap-4 cursor-pointer"
      >
        <div className="shrink-0 w-14 h-14 rounded-full bg-surface flex items-center justify-center">
          <UserCircle />
        </div>
        <div className="flex items-center justify-between flex-1">
          <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
            <p className={nameClassName}>{displayName}</p>
            {registeredDate && (
              <p className="text-text-muted font-normal text-xs font-manrope w-full text-left">
                {registeredDate}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <ArrowRight20 />
          </div>
        </div>
      </button>

      {(SITE.features.pointSystem || SITE.features.coupons) && (
        <div className="flex flex-col">
          <div className="pt-2">
            <div className="w-full h-px bg-border" />
          </div>
          <div className="flex gap-2">
            {SITE.features.pointSystem && (
              <PointCard pointBalance={pointBalance} onMenuChange={onMenuChange} />
            )}
            {SITE.features.pointSystem && SITE.features.coupons && (
              <div className="px-2">
                <div className="w-px h-full bg-border" />
              </div>
            )}
            {SITE.features.coupons && (
              <CouponCard couponCount={couponCount} onMenuChange={onMenuChange} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
