"use client";

import Image from "next/image";

import { BRAND } from "@/lib/utils/brand-config";

export const PointActivationContent = () => {
  return (
    <>
      <div className="flex flex-col items-start w-full gap-4">
        <h2 className="text-text-primary font-bold text-3xl font-manrope leading-9">
          {BRAND.name} Point -оо
          <br />
          идэвхжүүлээрэй
        </h2>
        <p className="text-text-secondary font-normal text-base font-manrope leading-6">
          Худалдан авалт бүрээс
          <br />
          <span className="text-text-primary font-bold">2% {BRAND.name} point</span> цуглуулаарай
        </p>
      </div>

      {/* Phone mockup */}
      <div className="absolute -bottom-5 -right-[192px] w-[727px] h-[544px] pointer-events-none">
        <Image src="/iPhone.png" alt={`${BRAND.name} Point`} fill className="object-contain" />
      </div>

      {/* Bottom gradient over image */}
      <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-linear-to-t from-white from-[100px] to-transparent pointer-events-none" />
    </>
  );
};

interface ActivateButtonProps {
  activating: boolean;
  onClick: () => void;
}

export const ActivateButton = ({ activating, onClick }: ActivateButtonProps) => (
  <div className="relative z-10">
    <button
      onClick={onClick}
      disabled={activating}
      className="flex w-full items-center justify-center px-3 py-2.5 h-11 bg-text-primary rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-surface-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {activating ? "Идэвхжүүлж байна..." : "Идэвхжүүлэх"}
    </button>
  </div>
);
