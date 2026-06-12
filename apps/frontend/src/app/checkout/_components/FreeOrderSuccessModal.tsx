"use client";

import Link from "next/link";

import { Success } from "@/components/svg";
import { PrimaryHeading } from "@/components/ui/typography";

/**
 * Confirmation modal shown after a free-total order (totalPayable = 0) is
 * placed successfully. The user has two routes from here: view the order in
 * their profile, or continue shopping.
 *
 * Stateless presentational component — the parent owns the open/close state.
 */
export function FreeOrderSuccessModal() {
  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      <div className="absolute inset-0 bg-overlay" aria-hidden="true" />
      <div className="relative w-full max-w-[375px] mx-4 bg-white border border-border rounded-[10px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10)] p-6 flex flex-col gap-6">
        <div className="flex flex-col items-center justify-center gap-8">
          <div className="w-[56px] h-[56px] bg-teal-500 rounded-full flex items-center justify-center">
            <Success />
          </div>
          <div className="flex flex-col items-center gap-2">
            <PrimaryHeading>Захиалга баталгаажлаа</PrimaryHeading>
            <p className="text-text-secondary font-normal text-base font-manrope text-center">
              Та захиалгаа профайл цэснээс хянах боломжтой
            </p>
          </div>
          <div className="flex gap-[10px] w-full">
            <Link
              href="/profile"
              prefetch={true}
              className="flex w-full items-center justify-center px-3 py-2.5 h-11 border border-border rounded-sm cursor-pointer text-text-primary font-normal text-base font-manrope hover:bg-surface transition-colors duration-200"
            >
              Захиалгаа харах
            </Link>
            <Link
              href="/products"
              prefetch={true}
              className="flex w-full items-center justify-center px-3 py-2.5 h-11 bg-text-primary rounded-sm cursor-pointer text-white font-normal text-base font-manrope hover:bg-surface-dark transition-colors duration-200"
            >
              Дэлгүүр хэсэх
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
