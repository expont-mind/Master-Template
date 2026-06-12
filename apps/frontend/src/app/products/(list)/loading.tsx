export default function ProductsLoading() {
  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0">
        {/* Header skeleton */}
        <div className="pt-5 md:pt-7 pb-2 flex items-center gap-4 lg:gap-16">
          <div className="lg:max-w-[280px] lg:w-full">
            <div className="h-9 w-24 skeleton" />
          </div>
          <div className="h-5 w-48 skeleton" />
        </div>

        <div className="flex gap-4 lg:gap-16">
          {/* Sidebar skeleton - hidden on mobile */}
          <div className="hidden lg:flex w-[280px] py-2.5 flex-col gap-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 skeleton rounded-sm" />
            ))}
          </div>

          {/* Main content skeleton */}
          <div className="flex-1">
            {/* Sort/Filter bar skeleton */}
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-1">
                <div className="h-6 w-8 skeleton" />
                <div className="h-5 w-24 skeleton" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-24 skeleton" />
                <div className="h-9 w-20 skeleton" />
              </div>
            </div>

            {/* Product grid skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 py-2.5">
              {[...Array(9)].map((_, i) => (
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
      </div>
    </div>
  );
}
