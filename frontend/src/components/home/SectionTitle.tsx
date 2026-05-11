import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronRightProduct } from "../svg";

interface SectionTitleProps {
  title: string;
  iconSrc?: string;
  href?: string;
}

export const SectionTitle = ({ title, iconSrc, href }: SectionTitleProps) => {
  const content = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-0.5 md:gap-2.5">
        {iconSrc && (
          <Image
            src={iconSrc}
            alt={title}
            width={40}
            height={40}
            quality={75}
            className="w-8 h-8 md:w-10 md:h-10 -ml-1 md:ml-0"
          />
        )}
        <p className="text-[#020617] truncate font-medium text-lg sm:text-2xl md:text-[26px] font-manrope tracking-[-0.26px] leading-7 sm:leading-8 md:leading-9 py-0 md:py-2">
          {title}
        </p>
      </div>
      <div className="hidden md:block">
        <ChevronRight />
      </div>
      <div className="py-2 flex items-center gap-0.5 md:hidden">
        <p className="text-[#64748B] font-medium text-sm font-manrope whitespace-nowrap">
          Цааш үзэх
        </p>
        <ChevronRightProduct />
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};
