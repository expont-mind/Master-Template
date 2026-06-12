export default function ProfileLoading() {
  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full pb-12 px-4 md:px-6 lg:px-0">
        {/* Title */}
        <p className="px-0.5 pb-2 pt-6 md:pt-10 lg:pt-[52px] text-text-primary font-bold text-xl md:text-2xl lg:text-[26px] leading-7 md:leading-8 lg:leading-9 font-manrope">
          Профайл
        </p>

        {/* Layout: Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-16 items-start">
          {/* Left Sidebar skeleton */}
          <div className="w-full lg:w-[280px] shrink-0 flex flex-col gap-4">
            {/* User info skeleton */}
            <div className="flex items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full skeleton" />
              <div className="flex flex-col gap-1">
                <div className="h-5 w-24 skeleton" />
                <div className="h-4 w-32 skeleton" />
              </div>
            </div>

            {/* Menu items skeleton */}
            <div className="flex flex-col gap-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-11 skeleton rounded-sm" />
              ))}
            </div>
          </div>

          {/* Right Content skeleton */}
          <div className="w-full lg:w-[720px] lg:shrink-0 pt-0 lg:pt-[10px]">
            {/* Orders skeleton */}
            <div className="flex flex-col gap-4">
              <div className="h-6 w-32 skeleton" />

              {/* Order cards skeleton */}
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-border rounded-lg p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-28 skeleton" />
                    <div className="h-5 w-20 skeleton" />
                  </div>
                  <div className="flex gap-3">
                    <div className="w-16 h-16 skeleton" />
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="h-5 w-full skeleton" />
                      <div className="h-4 w-24 skeleton" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="h-5 w-20 skeleton" />
                    <div className="h-5 w-24 skeleton" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
