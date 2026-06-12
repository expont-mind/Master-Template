export default function TermsOfServiceLoading() {
  return (
    <div className="w-full bg-white flex justify-center">
      <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0 py-8 md:py-12 lg:py-20">
        <div className="flex flex-col gap-8 md:gap-12">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="h-8 md:h-10 w-52 skeleton" />
            <div className="h-4 md:h-5 w-48 skeleton" />
          </div>

          {/* Content sections */}
          <div className="flex flex-col gap-8 md:gap-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="h-6 md:h-7 w-44 skeleton" />
                <div className="flex flex-col gap-1.5">
                  <div className="h-4 md:h-5 w-full skeleton" />
                  <div className="h-4 md:h-5 w-full skeleton" />
                  <div className="h-4 md:h-5 w-3/4 skeleton" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
