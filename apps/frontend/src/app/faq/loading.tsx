export default function FAQLoading() {
  return (
    <div className="w-full bg-white flex justify-center">
      <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0 py-8 md:py-12 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-12">
          {/* Left side - Title and description */}
          <div className="w-full lg:max-w-[296px] lg:shrink-0 py-2 lg:py-3.5 flex flex-col gap-2">
            <div className="h-8 md:h-9 w-56 skeleton" />
            <div className="flex flex-col gap-1">
              <div className="h-4 md:h-5 w-full skeleton" />
              <div className="h-4 md:h-5 w-3/4 skeleton" />
            </div>
          </div>

          {/* Right side - FAQ accordion skeleton */}
          <div className="flex-1">
            <div className="border-t border-border">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="border-b border-border">
                  <div className="w-full py-3 md:py-[14px] px-4 md:px-6 flex items-center justify-between gap-3 md:gap-4">
                    <div className="h-6 md:h-7 w-full skeleton" />
                    <div className="w-5 h-5 skeleton rounded-full shrink-0" />
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
