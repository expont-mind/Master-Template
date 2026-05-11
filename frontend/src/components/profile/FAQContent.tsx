"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDownFAQ, Slash } from "@/components/svg";
import { createClient } from "@/lib/supabase/client";
import type { FAQ } from "@/types/database";

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[#E2E8F0]">
      <button
        className="w-full py-3 md:py-[14px] px-4 md:px-6 flex items-center justify-between gap-3 md:gap-4 text-left cursor-pointer"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="text-[#020617] font-medium text-base md:text-lg leading-6 md:leading-7 font-manrope">
          {question}
        </span>
        <div
          className={`shrink-0 transition-transform duration-300 ease-in-out ${isOpen ? "rotate-180" : "rotate-0"}`}
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
            className={`text-[#64748B] px-4 md:px-6 pb-4 md:pb-5 font-normal text-sm font-manrope transition-opacity duration-300 ease-in-out ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export const FAQContent = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      const supabase = createClient();
      const { data } = await (supabase as any).from("faqs").select("*");
      if (data) setFaqs(data);
      setLoading(false);
    };
    fetchFaqs();
  }, []);

  return (
    <div className="flex flex-col gap-4 md:gap-2">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 px-px md:px-0.5 overflow-x-auto whitespace-nowrap scrollbar-hide">
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
            href="/profile?tab=help"
            className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
          >
            Тусламж
          </Link>
          <Slash />
          <p className="text-slate-950 text-sm font-normal font-manrope">
            Түгээмэл асуулт
          </p>
        </div>

        <p className="px-0 md:px-0.5 pb-0 md:pb-1 text-[#020617] font-bold md:font-semibold text-2xl md:text-xl font-manrope">
          Түгээмэл асуулт
        </p>
        <p className="text-[#64748B] font-normal text-sm md:text-base font-manrope px-0 md:px-0.5 pb-0 md:pb-2">
          Бүртгэл, захиалга, хүргэлт, төлбөрийн түгээмэл асуултын
          хариултуудыг эндээс үзнэ үү.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-[#020617] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : faqs.length === 0 ? (
        <p className="text-[#64748B] font-normal text-base font-manrope py-5">
          Асуулт олдсонгүй
        </p>
      ) : (
        <div className="border-t border-[#E2E8F0]">
          {faqs.map((faq, index) => (
            <FAQItem
              key={faq.id}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};
