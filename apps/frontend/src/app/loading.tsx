export default function HomeLoading() {
  return (
    <div className="flex flex-col w-full">
      {/* Carousel skeleton */}
      <div className="w-full bg-white flex justify-center">
        <div className="w-full py-[14px] md:py-0 px-5 md:px-0">
          <div className="w-full h-[calc((100vw-40px)*10/9)] md:h-[410px] rounded-[26px] md:rounded-none skeleton" />
        </div>
      </div>

      {/* Categories skeleton */}
      <div className="w-full bg-white flex justify-center">
        <div className="relative py-4 sm:py-8 md:py-10 max-w-[1064px] w-full">
          <div className="overflow-hidden">
            <div className="grid grid-rows-2 grid-flow-col gap-4 sm:grid-rows-1 sm:flex sm:items-start pl-4 md:pl-0">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1.5 items-center shrink-0 w-[56px] md:w-[96px]"
                >
                  <div className="w-[56px] md:w-[74px] h-[56px] md:h-[74px] rounded-[14px] md:rounded-[18px] skeleton" />
                  <div className="h-3 md:h-4 w-12 md:w-16 skeleton" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="py-2 bg-white px-4 md:px-0">
        <div className="w-full max-w-[1064px] mx-auto h-px bg-border" />
      </div>

      {/* Product sections skeleton */}
      {[...Array(3)].map((_, sectionIndex) => (
        <div key={sectionIndex} className="w-full bg-white flex justify-center">
          <div className="relative pt-10 sm:pt-12 md:pt-16 pb-10 flex flex-col gap-4 sm:gap-5 md:gap-7 max-w-[1064px] w-full">
            {/* Section header */}
            <div className="px-4 md:px-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 skeleton rounded-full" />
                <div className="h-6 w-32 skeleton" />
              </div>
              <div className="h-4 w-20 skeleton" />
            </div>

            {/* Products horizontal scroll */}
            <div className="flex gap-2 md:gap-4 overflow-hidden pl-4 md:pl-0">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="shrink-0 w-[calc(40vw-16px)] sm:w-[254px]">
                  <div className="flex flex-col gap-2.5">
                    <div className="w-full aspect-3/4 skeleton rounded-sm" />
                    <div className="space-y-2">
                      <div className="h-4 w-16 skeleton" />
                      <div className="h-5 w-full skeleton" />
                      <div className="h-5 w-3/4 skeleton" />
                      <div className="h-6 w-20 skeleton" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Brand logo section skeleton */}
      <div className="w-full bg-surface md:bg-white flex justify-center">
        <div className="relative py-6 md:py-10 max-w-[1064px] w-full">
          <div className="px-4 md:px-0 flex items-center justify-between mb-4 md:mb-7">
            <div className="h-6 w-24 skeleton" />
            <div className="h-4 w-20 skeleton" />
          </div>
          <div className="grid grid-cols-4 gap-3 px-4 md:flex md:gap-4 md:overflow-hidden md:pl-0">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-[72px] h-[72px] md:w-[200px] md:h-[200px] rounded-full skeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* More product sections */}
      {[...Array(2)].map((_, sectionIndex) => (
        <div key={`extra-${sectionIndex}`} className="w-full bg-white flex justify-center">
          <div className="relative pt-10 sm:pt-12 md:pt-16 pb-10 flex flex-col gap-4 sm:gap-5 md:gap-7 max-w-[1064px] w-full">
            <div className="px-4 md:px-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 skeleton rounded-full" />
                <div className="h-6 w-28 skeleton" />
              </div>
              <div className="h-4 w-20 skeleton" />
            </div>
            <div className="flex gap-2 md:gap-4 overflow-hidden pl-4 md:pl-0">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="shrink-0 w-[calc(40vw-16px)] sm:w-[254px]">
                  <div className="flex flex-col gap-2.5">
                    <div className="w-full aspect-3/4 skeleton rounded-sm" />
                    <div className="space-y-2">
                      <div className="h-4 w-16 skeleton" />
                      <div className="h-5 w-full skeleton" />
                      <div className="h-5 w-3/4 skeleton" />
                      <div className="h-6 w-20 skeleton" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
