export default function DataDeletionLoading() {
  return (
    <div className="w-full bg-white flex justify-center">
      <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0 py-8 md:py-12 lg:py-20">
        <div className="flex flex-col gap-8 md:gap-12">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="h-8 md:h-10 w-56 skeleton" />
            <div className="flex flex-col gap-1">
              <div className="h-4 md:h-5 w-full max-w-2xl skeleton" />
              <div className="h-4 md:h-5 w-3/4 max-w-2xl skeleton" />
            </div>
          </div>

          {/* Form skeleton */}
          <div className="flex flex-col gap-6 max-w-lg">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-20 skeleton" />
              <div className="h-12 w-full skeleton rounded-sm" />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-28 skeleton" />
              <div className="h-12 w-full skeleton rounded-sm" />
            </div>

            {/* Reason */}
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-32 skeleton" />
              <div className="h-24 w-full skeleton rounded-sm" />
            </div>

            {/* Warning box */}
            <div className="h-20 w-full skeleton rounded-lg" />

            {/* Submit button */}
            <div className="h-10 w-full sm:w-64 skeleton rounded-sm" />
          </div>

          {/* Info section */}
          <div className="flex flex-col gap-4 pt-6 border-t border-[#E2E8F0] max-w-2xl">
            <div className="h-6 w-36 skeleton" />
            <div className="flex flex-col gap-2 pl-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 md:h-5 w-64 skeleton" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
