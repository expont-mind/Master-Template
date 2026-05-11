"use client";

import Link from "next/link";
import { AboutIcon, FAQIcon, LocationProfile, Slash, TermsIcon } from "../svg";

// 20x20 arrow right icon
const ArrowRight20 = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
  >
    <path
      d="M7.5 5C7.5 5 12.5 8.68245 12.5 10.0001C12.5 11.3176 7.5 15 7.5 15"
      stroke="#64748B"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const helpItems: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  href: string;
  showArrow: boolean;
  showBorder: boolean;
}[] = [
  {
    icon: <LocationProfile />,
    label: "Салбар",
    subtitle: "Байршил, салбаруудын мэдээлэл",
    href: "/profile?tab=branches",
    showArrow: true,
    showBorder: true,
  },
  {
    icon: <FAQIcon />,
    label: "Түгээмэл асуулт",
    subtitle:
      "Бүртгэл, захиалга, хүргэлт, төлбөрийн түгээмэл асуултын хариултуудыг эндээс үзнэ үү.",
    href: "/profile?tab=faq",
    showArrow: true,
    showBorder: true,
  },
  {
    icon: <TermsIcon />,
    label: "Үйлчилгээний нөхцөл",
    subtitle: "Худалдан авалт, буцаалт, хүргэлтийн нөхцөл",
    href: "/terms-of-service",
    showArrow: true,
    showBorder: true,
  },
  {
    icon: <AboutIcon />,
    label: "Нууцлалын бодлого",
    subtitle: "Хувийн мэдээллийн хамгаалалт, ашиглалтын зарчим",
    href: "/privacy-policy",
    showArrow: true,
    showBorder: false,
  },
];

export const HelpContent = () => {
  return (
    <div className="flex flex-col gap-4 md:gap-2">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 md:hidden px-px">
          <Link
            href="/profile"
            className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
          >
            Профайл
          </Link>
          <Slash />
          <p className="text-slate-950 text-sm font-normal font-manrope">
            Тусламж
          </p>
        </div>

        <p className="px-0 md:px-0.5 pb-0 md:pb-3 text-[#020617] font-bold md:font-semibold text-2xl md:text-xl font-manrope">
          Тусламж
        </p>
      </div>

      {/* Menu items — same style as SettingsContent */}
      <div className="flex flex-col">
        {helpItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="w-full flex items-center gap-4 px-0.5 cursor-pointer transition-colors hover:bg-[#F8FAFC] rounded-lg"
          >
            <div className="shrink-0 text-[#020617]">{item.icon}</div>
            <div
              className={`flex-1 flex items-center gap-4 py-3.5 min-w-0 ${
                item.showBorder ? "border-b border-[#E2E8F0]" : ""
              }`}
            >
              <div className="flex-1 flex flex-col gap-0.5 items-start min-w-0">
                <p className="text-[#020617] font-medium text-sm font-manrope">
                  {item.label}
                </p>
                <p className="text-[#64748B] font-normal text-sm font-manrope truncate w-full text-left">
                  {item.subtitle}
                </p>
              </div>
              {item.showArrow && (
                <div className="shrink-0">
                  <ArrowRight20 />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
