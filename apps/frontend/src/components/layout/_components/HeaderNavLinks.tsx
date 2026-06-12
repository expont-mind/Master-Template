"use client";

import Link from "next/link";

import { ROUTES } from "@/lib/utils/constants";

interface HeaderNavLinksProps {
  pathname: string;
}

export function HeaderNavLinks({ pathname }: HeaderNavLinksProps) {
  return (
    <>
      <Link
        href={ROUTES.BRANDS}
        className={`font-medium hover:text-text-primary duration-200 text-[15px] font-manrope px-3 py-3 md:pt-4 md:pb-5 whitespace-nowrap border-b-2 transition-colors ${
          pathname === ROUTES.BRANDS
            ? "text-text-primary border-text-primary"
            : "text-text-secondary border-transparent"
        }`}
      >
        Брэнд
      </Link>
      <Link
        href={ROUTES.BEST_SELLERS}
        className={`font-medium hover:text-text-primary duration-200 text-[15px] font-manrope px-3 py-3 md:pt-4 md:pb-5 whitespace-nowrap border-b-2 transition-colors ${
          pathname === ROUTES.BEST_SELLERS
            ? "text-text-primary border-text-primary"
            : "text-text-secondary border-transparent"
        }`}
      >
        Best
      </Link>
      <Link
        href={ROUTES.NEW_ARRIVALS}
        className={`font-medium hover:text-text-primary duration-200 text-[15px] font-manrope px-3 py-3 md:pt-4 md:pb-5 whitespace-nowrap border-b-2 transition-colors ${
          pathname === ROUTES.NEW_ARRIVALS
            ? "text-text-primary border-text-primary"
            : "text-text-secondary border-transparent"
        }`}
      >
        New
      </Link>
    </>
  );
}
