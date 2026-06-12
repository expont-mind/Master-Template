"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Search } from "@/components/svg";
import { ROUTES } from "@/lib/utils/constants";

function HeaderSearchLabel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = pathname === ROUTES.SEARCH ? (searchParams.get("q") ?? "") : "";
  return (
    <span
      className={`text-sm font-normal font-manrope truncate ${
        q ? "text-text-primary" : "text-text-secondary"
      }`}
    >
      {q || "Хайх"}
    </span>
  );
}

interface HeaderSearchTriggerProps {
  onOpen: () => void;
}

export function HeaderSearchTrigger({ onOpen }: HeaderSearchTriggerProps) {
  return (
    <button
      onClick={onOpen}
      className="relative max-w-[280px] flex-1 cursor-pointer hidden md:block"
    >
      <div className="p-1 flex items-center gap-1 w-full border border-border rounded-lg hover:border-border-strong transition-colors">
        <div className="p-1.5">
          <Search />
        </div>
        <Suspense
          fallback={
            <span className="text-text-secondary text-sm font-normal font-manrope">Хайх</span>
          }
        >
          <HeaderSearchLabel />
        </Suspense>
      </div>
    </button>
  );
}
