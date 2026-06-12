export default function BrandDetailLoading() {
  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full pb-[52px] px-4 xl:px-0">
        {/* Breadcrumb skeleton */}
        <div className="flex flex-col pt-5 md:pt-8 pb-2">
          <div className="flex items-center gap-1.5 px-1">
            <div className="h-4 w-12 skeleton" />
            <div className="h-4 w-4 skeleton" />
            <div className="h-4 w-24 skeleton" />
          </div>
          {/* Brand name skeleton */}
          <div className="h-9 w-40 skeleton mt-1 px-0.5" />
        </div>

        <div className="flex flex-col gap-4">
          {/* Banner skeleton */}
          <div className="w-full h-[200px] md:h-[358px] skeleton rounded-sm" />

          {/* Separator */}
          <div className="py-2">
            <div className="w-full h-px bg-border" />
          </div>

          <div className="flex flex-col gap-7">
            {/* Product count + sort skeleton */}
            <div className="flex items-center justify-between">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col gap-2.5 w-full">
                  <div className="w-full aspect-[3/4] rounded-[4px] skeleton" />
                  <div className="space-y-2">
                    <div className="h-4 w-16 skeleton" />
                    <div className="h-5 w-full skeleton" />
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
