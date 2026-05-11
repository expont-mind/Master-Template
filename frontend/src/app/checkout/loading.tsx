export default function CheckoutLoading() {
  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col gap-5 max-w-[1064px] w-full px-4 xl:px-0 pb-10">
        {/* Breadcrumb skeleton */}
        <div className="flex flex-col pt-6 md:pt-8 pb-2">
          <div className="flex items-center gap-1.5 px-1">
            <div className="h-4 w-10 skeleton" />
            <div className="h-4 w-4 skeleton" />
            <div className="h-4 w-36 skeleton" />
          </div>
          {/* Title skeleton */}
          <div className="h-9 w-56 skeleton mt-1 px-0.5" />
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-4 items-start">
          {/* Left: Forms skeleton */}
          <div className="w-full flex-1 flex flex-col gap-8 pr-0 md:pr-16 lg:pr-32">
            {/* Delivery address form skeleton */}
            <div className="flex flex-col gap-4">
              <div className="h-6 w-32 skeleton" />
              <div className="flex flex-col gap-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="h-4 w-20 skeleton" />
                    <div className="h-12 w-full skeleton rounded-sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Contact form skeleton */}
            <div className="flex flex-col gap-4">
              <div className="h-6 w-40 skeleton" />
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="h-4 w-16 skeleton" />
                    <div className="h-12 w-full skeleton rounded-sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Payment summary skeleton */}
          <div className="w-full md:w-[342px] md:shrink-0 flex flex-col gap-4">
            <div className="h-6 w-40 skeleton" />

            {/* Cart items skeleton */}
            <div className="flex flex-col gap-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="w-16 h-16 skeleton shrink-0" />
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="h-4 w-full skeleton" />
                    <div className="h-4 w-20 skeleton" />
                  </div>
                </div>
              ))}
            </div>

            <div className="py-2">
              <div className="w-full h-px bg-[#E2E8F0]" />
            </div>

            {/* Totals skeleton */}
            <div className="flex flex-col gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-5 w-24 skeleton" />
                  <div className="h-5 w-20 skeleton" />
                </div>
              ))}
            </div>

            <div className="py-2">
              <div className="w-full h-px bg-[#E2E8F0]" />
            </div>

            <div className="flex items-center justify-between">
              <div className="h-6 w-28 skeleton" />
              <div className="h-6 w-24 skeleton" />
            </div>

            <div className="h-11 w-full skeleton rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
