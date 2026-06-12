"use client";

import { SITE } from "@repo/config-site";

import { MPointBadgeBlack, User } from "@/components/svg";

interface HeaderUserButtonProps {
  pointBalance: number | null;
  onClick: () => void;
}

export function HeaderUserButton({ pointBalance, onClick }: HeaderUserButtonProps) {
  return (
    <div className="pl-[5px]">
      <button
        onClick={onClick}
        className="flex items-center gap-1 pl-1.5 pr-2.5 py-[5px] rounded-full border border-text-primary cursor-pointer"
      >
        <User />
        {SITE.features.pointSystem && (
          <div className="flex items-center gap-[3px]">
            <p className="text-text-primary font-normal text-[15px] font-manrope">
              {pointBalance?.toLocaleString() || 0}
            </p>
            <div className="flex items-center gap-px">
              <MPointBadgeBlack />
              <span className="text-text-primary font-normal text-base font-manrope">/</span>
              <span className="text-text-primary font-normal text-base font-manrope">₮</span>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
