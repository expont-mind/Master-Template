import Image from "next/image";

interface BannerProps {
  title: string;
  description: string;
  iconSrc?: string;
  variant: "rose" | "blue";
}

export const Banner = ({
  title,
  description,
  iconSrc,
  variant,
}: BannerProps) => {
  const bgColor = variant === "rose" ? "bg-[#FB7185]" : "bg-[#3B82F6]";
  const iconBg = variant === "rose" ? "bg-[#FECDD3]" : "bg-[#BFDBFE]";

  return (
    <div className="w-full bg-slate-50 py-10 sm:py-16 md:py-28 px-4 flex justify-center">
      <div
        className={`w-full max-w-[720px] rounded-md ${bgColor} border border-[#E2E8F0] overflow-hidden flex items-center gap-3 sm:gap-6`}
      >
        <div className="flex-1 flex flex-col gap-1 pt-2 sm:pt-3 pb-3 sm:pb-4 px-4 sm:px-7">
          <h3 className="text-white font-bold text-base sm:text-lg font-manrope leading-6 sm:leading-7">
            {title}
          </h3>
          <p className="text-white font-medium text-sm sm:text-base font-manrope leading-5 sm:leading-6">
            {description}
          </p>
        </div>
        <div
          className={`self-stretch w-[72px] sm:w-[108px] ${iconBg} flex items-center justify-center shrink-0`}
        >
          {iconSrc ? (
            <Image src={iconSrc} alt={title} width={64} height={64} quality={75} />
          ) : (
            <span className="text-3xl sm:text-5xl">
              {variant === "rose" ? "🚚" : "✅"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
