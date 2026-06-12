"use client";

import Link from "next/link";

import { Slash } from "@/components/svg";
import { stripPhonePrefix } from "@/lib/utils/formatters";

export function PhoneVerifiedView({ primaryPhone }: { primaryPhone: string }) {
  return (
    <div className="flex flex-col gap-4 md:gap-2">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 px-px md:px-0.5">
          <div className="flex items-center gap-1.5 md:hidden">
            <Link
              href="/profile"
              className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
            >
              Профайл
            </Link>
            <Slash />
          </div>
          <Link
            href="/profile?tab=settings"
            className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
          >
            Тохиргоо
          </Link>
          <Slash />
          <p className="text-slate-950 text-sm font-normal font-manrope">Баталгаат утас</p>
        </div>

        <p className="px-0 md:px-0.5 pb-0 md:pb-3 text-text-primary font-bold md:font-semibold text-2xl md:text-xl font-manrope">
          Баталгаат утас
        </p>
      </div>

      <div className="flex flex-col gap-4 px-0.5">
        <div className="flex items-center justify-between py-4 border-b border-border">
          <div className="flex flex-col gap-1">
            <p className="text-text-primary font-medium text-sm font-manrope leading-5">
              Утасны дугаар
            </p>
            <p className="text-text-secondary font-normal text-sm font-manrope leading-5">
              {stripPhonePrefix(primaryPhone)}
            </p>
          </div>
          <span className="bg-teal-50 text-teal-500 font-medium text-sm font-manrope leading-5 px-2 py-0.5 rounded-[4px]">
            Баталгаажсан
          </span>
        </div>
      </div>
    </div>
  );
}
