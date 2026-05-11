export default function ProductsLoading() {
  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full">
        <div className="pt-7 pb-2 flex items-center gap-16">
          <div className="max-w-[280px] w-full px-1.5">
            <div className="h-9 w-40 skeleton" />
          </div>
          <div className="h-6 w-60 skeleton" />
        </div>

        <div className="flex gap-16">
          {/* Sidebar skeleton */}
          <div className="w-[280px] py-2.5 flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-8 skeleton rounded-sm"
              />
            ))}
          </div>

          {/* Main content skeleton */}
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between py-2.5">
              <div className="h-6 w-32 skeleton" />
              <div className="flex gap-2">
                <div className="h-9 w-28 skeleton" />
                <div className="h-9 w-20 skeleton" />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 py-2.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2.5 w-full max-w-[254px]"
                >
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
    </div>
  );
}
