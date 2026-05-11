export default function CartLoading() {
  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full pb-[52px] px-4 xl:px-0">
        {/* Title */}
        <p className="px-0.5 pb-2 pt-8 md:pt-[52px] text-[#020617] font-bold text-xl md:text-[26px] leading-9 font-manrope">
          Сагс
        </p>

        <div className="flex flex-col md:flex-row gap-4 items-start pt-4">
          {/* Left: Cart items skeleton */}
          <div className="pr-0 md:pr-16 pt-1.5 flex flex-col w-full">
            <div className="flex items-center justify-between pb-5">
              <div className="h-5 w-32 skeleton" />
              <div className="h-4 w-24 skeleton" />
            </div>

            <div className="py-2">
              <div className="w-full h-px bg-[#E2E8F0]" />
            </div>

            {/* Cart items skeleton */}
            <div className="flex flex-col gap-4 pt-4">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex gap-5 items-center">
                      <div className="w-[104px] h-[104px] rounded-sm skeleton shrink-0" />
                      <div className="flex flex-1 flex-col gap-2">
                        <div className="h-6 w-full skeleton" />
                        <div className="h-4 w-20 skeleton" />
                        <div className="h-5 w-24 skeleton" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 skeleton" />
                        <div className="w-8 h-6 skeleton" />
                        <div className="w-8 h-8 skeleton" />
                      </div>
                      <div className="w-8 h-8 skeleton" />
                    </div>
                  </div>
                  {i < 2 && (
                    <div className="py-2 mt-4">
                      <div className="w-full h-px bg-[#E2E8F0]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Payment summary skeleton */}
          <div className="w-full md:w-[342px] md:shrink-0 flex flex-col gap-6">
            <div className="flex flex-col gap-8">
              <div className="h-6 w-40 skeleton" />

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="h-5 w-24 skeleton" />
                      <div className="h-5 w-20 skeleton" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="py-2">
                <div className="w-full h-px bg-[#E2E8F0]" />
              </div>

              <div className="flex items-center justify-between">
                <div className="h-6 w-28 skeleton" />
                <div className="h-6 w-24 skeleton" />
              </div>
            </div>

            <div className="h-11 w-full skeleton rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
