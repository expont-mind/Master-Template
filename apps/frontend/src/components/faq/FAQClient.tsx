"use client";

import { useState } from "react";

import { ChevronDownFAQ } from "@/components/svg";

import type { FAQ } from "@/types/database";

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-border">
      <button
        className="w-full py-3 md:py-[14px] px-4 md:px-6 flex items-center justify-between gap-3 md:gap-4 text-left cursor-pointer"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="text-text-primary font-medium text-base md:text-lg leading-6 md:leading-7 font-manrope">
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
        style={{
          gridTemplateRows: isOpen ? "1fr" : "0fr",
        }}
      >
        <div className="overflow-hidden">
          <p
            className={`text-text-secondary px-4 md:px-6 pb-4 md:pb-5 font-normal text-sm font-manrope transition-opacity duration-300 ease-in-out ${
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

interface FAQClientProps {
  faqs: FAQ[];
}

export function FAQClient({ faqs }: FAQClientProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full bg-white flex justify-center">
      <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0 py-8 md:py-12 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-12">
          {/* Left side - Title and description */}
          <div className="w-full lg:max-w-[296px] lg:shrink-0 py-2 lg:py-3.5 flex flex-col gap-2">
            <h1 className="text-text-primary font-bold text-2xl md:text-[26px] lg:text-[28px] leading-8 md:leading-9 font-manrope">
              Түгээмэл асуултууд
            </h1>
            <p className="text-text-secondary font-normal text-sm md:text-base font-manrope">
              Бүртгэл, захиалга, хүргэлт, төлбөрийн түгээмэл асуултын хариултуудыг эндээс үзнэ үү.
            </p>
          </div>

          {/* Right side - FAQ accordion */}
          <div className="flex-1">
            {faqs.length === 0 ? (
              <p className="text-text-secondary font-normal text-base font-manrope py-5">
                Асуулт олдсонгүй
              </p>
            ) : (
              <div className="border-t border-border">
                {faqs.map((faq, index) => (
                  <FAQItem
                    key={faq.id}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openIndex === index}
                    onToggle={() => handleToggle(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
