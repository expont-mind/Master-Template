"use client";

import Image from "next/image";

type BannerVariant = "product" | "brand";

interface StaticBannerProps {
  variant?: BannerVariant;
  className?: string;
}

const bannerConfig = {
  product: {
    title: null,
    description:
      "Таны захиалсан бараа Солонгос улсаас Монгол улсруу 3-5 хоногт хүргэгдэнэ.",
    bgColor: "bg-blue-400",
    iconBgColor: "bg-blue-200",
    textColor: "text-white",
    iconSrc: "/images/banner-2.png",
  },
  brand: {
    title: "Илүү хурдан хүргэлт",
    description:
      "Таны захиалсан бараа Солонгос улсаас Монгол улсруу 3-5 хоногт хүргэгдэнэ.",
    bgColor: "bg-amber-300",
    iconBgColor: "bg-amber-200",
    textColor: "text-gray-900",
    iconSrc: "/images/brand-icon.png",
  },
};

export function StaticBanner({
  variant = "product",
  className = "",
}: StaticBannerProps) {
  const config = bannerConfig[variant];

  return (
    <div
      className={` py-10 md:py-28 bg-white md:bg-[#F8FAFC] px-4 md:px-0 ${className}`}
    >
      <div className="w-full max-w-[720px] mx-auto">
        <div
          className={`flex items-center gap-2 md:gap-6 ${config.bgColor} rounded-lg overflow-hidden border border-slate-200`}
        >
          <div
            className={`flex-1 flex flex-col gap-0 md:gap-1 py-0 md:py-3 pb-0 md:pb-4 pl-4 md:px-7 ${config.textColor}`}
          >
            {config.title && (
              <p className="text-lg font-bold leading-7 hidden md:block">
                {config.title}
              </p>
            )}
            <p className="text-xs md:text-base font-medium">
              {config.description}
            </p>
          </div>
          <div className="flex items-center self-stretch">
            <div
              className={`${config.iconBgColor} h-full flex items-center justify-center px-4 w-[80px] md:min-w-[108px]`}
            >
              <Image
                src={config.iconSrc}
                alt="image"
                width={72}
                height={72}
                quality={75}
                className="h-[72px] md:h-16 w-[72px] md:w-16 object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
