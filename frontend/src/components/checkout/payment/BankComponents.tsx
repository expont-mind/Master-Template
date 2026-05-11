"use client";

import { Copy } from "@/components/svg";
import { Check } from "lucide-react";

export function BankField({
  label,
  value,
  copyable,
  onCopy,
  copied,
  semibold,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  onCopy?: () => void;
  copied?: boolean;
  semibold?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[#020617] font-normal text-sm font-manrope leading-6">
        {label}
      </p>
      <div className="flex items-center gap-2 h-12 pl-3 pr-0.5 bg-[#F1F5F9] rounded-sm">
        <p
          className={`text-[#020617] ${semibold ? "font-semibold" : "font-normal"} text-sm font-manrope w-full`}
        >
          {value}
        </p>
        {copyable && (
          <button
            onClick={onCopy}
            className="p-2 cursor-pointer hover:opacity-80 transition-opacity"
            aria-label={`Copy ${label}`}
          >
            {copied ? <Check color="#64748B" /> : <Copy />}
          </button>
        )}
      </div>
    </div>
  );
}

export function getBankDescription(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("social")) return "Social Pay ашиглах";
  if (lowerName.includes("mbank") || lowerName.includes("m bank"))
    return "Мобайл апп ашиглах";
  if (lowerName.includes("monpay")) return "Monpay апп ашиглах";
  return `${name} ашиглах`;
}

export function BankAppCard({
  bank,
  description,
}: {
  bank: { name: string; logo?: string; link: string };
  description: string;
}) {
  const handleClick = () => {
    // Deeplinks need direct navigation, not target="_blank"
    window.location.href = bank.link;
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2.5 p-2 bg-white border border-[#E2E8F0] rounded-2xl hover:border-[#CBD5E1] transition-colors cursor-pointer text-left"
    >
      {bank.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bank.logo}
          alt={bank.name}
          width={48}
          height={48}
          className="w-12 h-12 rounded-lg border border-[#E2E8F0] object-contain shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-[#F1F5F9] flex items-center justify-center shrink-0">
          <span className="text-[#64748B] text-sm font-bold">
            {bank.name.charAt(0)}
          </span>
        </div>
      )}
      <div className="flex flex-col min-w-0">
        <p className="text-[#020617] font-normal text-sm font-manrope">
          {bank.name}
        </p>
        {description && (
          <p className="text-[#64748B] font-normal text-xs font-manrope hidden md:block">
            {description}
          </p>
        )}
      </div>
    </button>
  );
}
