"use client";

import { Minus, Plus } from "@/components/svg";
import { PrimaryMediumSm } from "@/components/ui/typography";

export function VariantsSkeleton({ hasOptionGroups }: { hasOptionGroups?: boolean }) {
  if (hasOptionGroups) {
    return (
      <div className="flex flex-col gap-5">
        {[1, 2].map((group) => (
          <div key={group} className="flex flex-col gap-1.5">
            <div className="h-4 w-14 skeleton rounded" />
            <div className="flex gap-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-[34px] w-[90px] skeleton rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col">
      <div className="h-4 w-10 skeleton rounded" />
      <div className="grid grid-cols-2 gap-2 pt-3 px-0.5">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-12 w-full skeleton rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function QuantityControl({
  quantity,
  canDecrease,
  canIncrease,
  onChange,
}: {
  quantity: number;
  canDecrease: boolean;
  canIncrease: boolean;
  onChange: (delta: number) => void;
}) {
  return (
    <div className="flex items-center gap-5 pt-1">
      <PrimaryMediumSm>Тоо ширхэг</PrimaryMediumSm>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onChange(-1)}
          disabled={!canDecrease}
          className={`w-8 h-8 flex items-center justify-center border rounded-sm transition-all duration-200 ${
            canDecrease
              ? "border-text-primary cursor-pointer hover:bg-surface"
              : "border-border-strong"
          }`}
        >
          <Minus color={canDecrease ? "#020617" : "#CBD5E1"} />
        </button>
        <span className="w-8 h-8 flex items-center justify-center text-text-primary font-semibold text-sm">
          {quantity}
        </span>
        <button
          onClick={() => onChange(1)}
          disabled={!canIncrease}
          className={`w-8 h-8 flex items-center justify-center border rounded-sm transition-all duration-200 ${
            canIncrease
              ? "border-text-primary cursor-pointer hover:bg-surface"
              : "border-border-strong"
          }`}
        >
          <Plus color={canIncrease ? "#020617" : "#CBD5E1"} />
        </button>
      </div>
    </div>
  );
}

export function VariantsLoadingState({ hasOptionGroups }: { hasOptionGroups?: boolean }) {
  return (
    <div className="hidden md:flex flex-col gap-6">
      <VariantsSkeleton hasOptionGroups={hasOptionGroups} />
      <div className="flex items-center gap-5 pt-1">
        <div className="h-4 w-16 skeleton rounded" />
        <div className="flex items-center gap-0.5">
          <div className="w-8 h-8 skeleton rounded-sm" />
          <div className="w-8 h-8" />
          <div className="w-8 h-8 skeleton rounded-sm" />
        </div>
      </div>
    </div>
  );
}
