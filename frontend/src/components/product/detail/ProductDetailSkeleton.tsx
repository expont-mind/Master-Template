// Skeleton shown while the initial product detail query is loading.
// Mirrors the final layout (gallery, variants, sticky right panel,
// mobile bottom bar) so the page doesn't jump when content lands.

export function ProductDetailSkeleton() {
  return (
    <div className="w-full bg-white flex justify-center">
      <div className="flex flex-col max-w-[1064px] w-full px-0 pb-0 md:pb-[200px]">
        {/* Breadcrumb - desktop only */}
        <div className="py-4 hidden md:flex items-center gap-1.5 px-4 xl:px-0">
          <div className="h-5 w-48 skeleton" />
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Left */}
          <div className="flex flex-col w-full md:max-w-[696px]">
            {/* Tabs */}
            <div className="flex items-center gap-8 sm:gap-6 px-4 md:px-0 mb-[10px]">
              <div className="h-10 w-[100px] skeleton" />
              <div className="h-10 w-[130px] skeleton" />
              <div className="h-10 w-[70px] skeleton" />
            </div>

            <div className="flex flex-col gap-0 md:gap-[10px] max-w-[640px]">
              <div className="flex flex-col md:flex-row gap-0 md:gap-4">
                {/* Thumbnails - desktop */}
                <div className="hidden md:flex flex-col gap-2 w-[96px] shrink-0">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-[96px] h-[120px] skeleton rounded-sm" />
                  ))}
                </div>
                {/* Main image */}
                <div className="w-full md:w-[528px] h-[472px] md:h-[660px] skeleton md:rounded-sm" />
              </div>

              {/* Mobile thumbnails */}
              <div className="md:hidden flex gap-2 pl-[18px] pt-3 pb-1.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-[46px] h-[46px] skeleton rounded-[9px] shrink-0" />
                ))}
              </div>
            </div>

            {/* Mobile: Product Info */}
            <div className="md:hidden flex flex-col gap-1 w-full px-4 pb-6">
              <div className="py-2">
                <div className="w-full h-px bg-[#E2E8F0]" />
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[34px] h-[34px] rounded-full skeleton" />
                      <div className="h-5 w-24 skeleton" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="h-7 w-full skeleton" />
                      <div className="h-7 w-2/3 skeleton" />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-4 h-4 skeleton rounded-sm" />
                        ))}
                      </div>
                      <div className="h-4 w-6 skeleton" />
                      <div className="h-4 w-16 skeleton" />
                    </div>
                  </div>
                  <div className="flex items-end gap-1">
                    <div className="h-8 w-12 skeleton" />
                    <div className="h-8 w-28 skeleton" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="h-5 w-full skeleton" />
                    <div className="h-5 w-3/4 skeleton" />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="h-5 w-20 skeleton" />
                  <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-10 w-20 skeleton rounded-sm" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full h-2 bg-[#F1F5F9] block md:hidden" />
          </div>

          {/* Right - desktop only */}
          <div className="hidden md:flex flex-col gap-5 w-full md:max-w-[368px]">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-[14px]">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-[34px] h-[34px] rounded-full skeleton" />
                    <div className="h-5 w-24 skeleton" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="h-7 w-full skeleton" />
                    <div className="h-7 w-2/3 skeleton" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-4 h-4 skeleton rounded-sm" />
                      ))}
                    </div>
                    <div className="h-4 w-6 skeleton" />
                    <div className="h-4 w-16 skeleton" />
                  </div>
                </div>
                <div className="flex items-end gap-1">
                  <div className="h-8 w-12 skeleton" />
                  <div className="h-8 w-28 skeleton" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-5 w-full skeleton" />
                  <div className="h-5 w-3/4 skeleton" />
                </div>
              </div>
              <div className="py-2">
                <div className="w-full h-px bg-[#E2E8F0]" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="h-5 w-20 skeleton" />
                <div className="flex gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 w-20 skeleton rounded-sm" />
                  ))}
                </div>
              </div>
            </div>
            <div className="py-2">
              <div className="w-full h-px bg-[#E2E8F0]" />
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex justify-end items-end gap-3 px-0.5">
                <div className="h-5 w-32 skeleton" />
                <div className="h-6 w-24 skeleton" />
              </div>
              <div className="flex gap-3 md:pl-2 items-center">
                <div className="w-11 h-11 skeleton rounded-sm" />
                <div className="flex-1 h-11 skeleton rounded-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E2E8F0] px-4 py-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex gap-3 items-center">
          <div className="w-14 h-14 skeleton rounded-sm" />
          <div className="flex-1 h-14 skeleton rounded-sm" />
        </div>
      </div>
    </div>
  );
}
