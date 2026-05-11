export default function WishlistLoading() {
  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full pb-[52px] px-4 xl:px-0">
        {/* Title */}
        <p className="px-0.5 pb-2 pt-8 md:pt-[52px] text-[#020617] font-bold text-xl md:text-[26px] leading-9 font-manrope">
          Хадгалсан
        </p>

        <div className="flex items-center justify-between pt-1.5 pb-5">
          <div className="h-5 w-32 skeleton" />
          <div className="h-4 w-36 skeleton" />
        </div>

        <div className="py-2">
          <div className="w-full h-px bg-[#E2E8F0]" />
        </div>

        {/* Product grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2.5 w-full">
              <div className="w-full h-[340px] rounded-[4px] skeleton" />
              <div className="space-y-2">
                <div className="h-4 w-16 skeleton" />
                <div className="h-5 w-full skeleton" />
                <div className="h-5 w-3/4 skeleton" />
                <div className="h-6 w-24 skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
