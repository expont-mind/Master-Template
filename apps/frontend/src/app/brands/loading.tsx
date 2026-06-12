export default function BrandsLoading() {
  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0">
        {/* Title */}
        <p className="px-0.5 pb-2 pt-5 md:pt-9 text-text-primary font-bold text-xl md:text-[26px] leading-9 font-manrope">
          Бренд
        </p>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-16 py-4">
          {/* Left sidebar skeleton */}
          <div className="w-full lg:w-[210px] shrink-0 flex flex-col gap-1.5">
            {/* Search skeleton */}
            <div className="pt-4 pb-3">
              <div className="h-11 skeleton rounded-full" />
            </div>

            <div className="py-2.5">
              <div className="w-full h-px bg-border" />
            </div>

            {/* Alphabet grid skeleton */}
            <div className="flex flex-col gap-1 py-3">
              {[...Array(4)].map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-1">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="w-8 h-8 skeleton rounded-sm" />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Brand grid skeleton */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 py-0.5">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-16 skeleton rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
