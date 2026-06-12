import Image from "next/image";
import Link from "next/link";

import { ChevronRightProduct } from "@/components/svg";

interface SectionTitleProps {
  title: string;
  iconSrc?: string;
  href?: string;
}

export const SectionTitle = ({ title, iconSrc, href }: SectionTitleProps) => {
  const content = (
    <div className="flex items-center justify-between max-w-[640px]">
      <div className="flex items-center gap-2.5">
        {iconSrc && <Image src={iconSrc} alt={title} width={32} height={32} quality={90} />}
        <p className="text-text-primary font-semibold text-lg sm:text-xl md:text-xl font-manrope tracking-[-0.26px]">
          {title}
        </p>
      </div>
      <div className="py-2 flex items-center gap-0.5">
        <p className="text-text-secondary font-medium text-sm md:text-base font-manrope">
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
