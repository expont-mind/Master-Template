"use client";

import { Search } from "@/components/svg";

interface SuggestionRowProps {
  text: string;
  isHighlighted: boolean;
  trailingIcon?: React.ReactNode;
  onClick: () => void;
}

const baseClass =
  "flex items-center justify-between px-0.5 py-2 w-full cursor-pointer transition-colors";

export function SuggestionRow({ text, isHighlighted, trailingIcon, onClick }: SuggestionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClass} ${isHighlighted ? "bg-border-light" : "hover:bg-surface"}`}
    >
      <p className="text-base text-text-secondary font-manrope truncate flex-1 min-w-0 text-left">
        {text}
      </p>
      {trailingIcon ?? <Search color="#94A3B8" width={24} height={24} className="shrink-0" />}
    </button>
  );
}

export function SuggestionGroupHeader({ label }: { label: string }) {
  return (
    <div className="bg-surface px-4 py-2 w-full">
      <p className="text-xs font-light text-text-secondary font-manrope">{label}</p>
    </div>
  );
}

export function SectionTitle({ label }: { label: string }) {
  return (
    <div className="pt-3 pb-2 pl-0.5">
      <p className="text-base font-medium text-text-primary font-manrope">{label}</p>
    </div>
  );
}
