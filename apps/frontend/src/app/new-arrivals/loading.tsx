export default function NewArrivalsLoading() {
  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0">
        {/* Title */}
        <p className="px-0.5 pb-2 pt-5 md:pt-9 text-text-primary font-bold text-xl md:text-[26px] leading-9 font-manrope">
          Шинээр нэмэгдсэн
        </p>

        <div className="flex flex-col gap-7 pt-7 pb-10">
          {/* Chip filters skeleton */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-9 w-24 skeleton rounded-full shrink-0" />
            ))}
          </div>

          {/* Product grid skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2.5 w-full">
                <div className="w-full h-[340px] rounded-[4px] skeleton" />
                <div className="space-y-2">
                  <div className="h-9 skeleton" />
                  <div className="h-12 skeleton" />
                  <div className="h-6 w-24 skeleton" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
