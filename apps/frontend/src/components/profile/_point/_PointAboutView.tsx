"use client";

import Link from "next/link";
import { useState } from "react";

import { ChevronDownFAQ, HelpCircle, Slash } from "@/components/svg";
import { MutedText } from "@/components/ui/typography";
import { BRAND } from "@/lib/utils/brand-config";

import { type PointFaq } from "./_types";

interface PointAboutViewProps {
  faqs: PointFaq[];
}

function FaqItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: PointFaq;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border flex flex-col">
      <button
        type="button"
        className="w-full py-3.5 flex items-center justify-between gap-3 md:gap-4 text-left cursor-pointer"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="text-text-primary font-medium text-sm md:text-lg font-manrope">
          {faq.question}
        </span>
        <div
          className={`shrink-0 transition-transform duration-300 ease-in-out ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        >
          <ChevronDownFAQ />
        </div>
      </button>
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p
            className={`text-text-secondary pt-2 pb-3.5 font-normal text-sm md:text-lg font-manrope transition-opacity duration-300 ease-in-out ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            {faq.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PointAboutView({ faqs }: PointAboutViewProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div className="flex flex-col px-4 md:px-0 gap-2">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 px-px md:px-0.5">
          <Link
            href="/profile"
            className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
          >
            Профайл
          </Link>
          <Slash />
          <Link
            href="/profile?tab=point"
            className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
          >
            {BRAND.name} point
          </Link>
          <Slash />
          <p className="text-slate-950 text-sm font-normal font-manrope">Тухай</p>
        </div>
        <p className="px-0 md:px-0.5 pb-0 md:pb-3 text-text-primary font-bold md:font-semibold text-2xl md:text-xl font-manrope">
          Тухай
        </p>
      </div>

      {faqs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-10">
          <div className="flex flex-col items-center justify-center">
            <div className="p-[9px]">
              <HelpCircle />
            </div>
            <MutedText>Одоогоор мэдээлэл алга байна</MutedText>
          </div>
        </div>
      ) : (
        faqs.map((faq, index) => (
          <FaqItem
            key={faq.id}
            faq={faq}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))
      )}
    </div>
  );
}
