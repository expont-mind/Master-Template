import Link from "next/link";

import { Slash } from "@/components/svg";

export function CheckoutBreadcrumb() {
  return (
    <div className="flex flex-col pt-6 md:pt-8 pb-2">
      <div className="flex items-center gap-1.5 px-1">
        <Link
          href="/cart"
          className="text-text-secondary font-normal text-sm font-manrope hover:text-text-primary transition-colors duration-200"
        >
          Сагс
        </Link>
        <Slash />
        <span className="text-text-primary font-normal text-sm font-manrope">
          Захиалга баталгаажуулах
        </span>
      </div>
      <p className="px-0.5 text-text-primary font-bold text-xl md:text-[26px] leading-7 md:leading-9 font-manrope tracking-[-0.26px]">
        Захиалга баталгаажуулах
      </p>
    </div>
  );
}
