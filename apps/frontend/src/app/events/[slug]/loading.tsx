export default function EventDetailLoading() {
  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col gap-4 max-w-[1064px] w-full pb-20 md:pb-[52px] px-4 xl:px-0">
        {/* Breadcrumb */}
        <div className="flex flex-col py-2.5 md:pt-8 md:pb-2">
          <div className="flex items-center gap-1.5 px-1">
            <div className="h-4 w-12 skeleton" />
            <div className="h-4 w-4 skeleton" />
            <div className="h-4 w-32 skeleton" />
          </div>
          {/* Title - desktop */}
          <div className="hidden md:block h-9 w-72 skeleton mt-1 px-0.5" />
        </div>

        <div className="flex flex-col gap-12">
          {/* Main Image */}
          <div className="w-full h-[280px] md:h-[448px] skeleton rounded-sm" />

          <div className="flex flex-col lg:flex-row gap-16 lg:gap-[106px]">
            {/* Left Column - Event Info */}
            <div className="w-full lg:w-[254px] lg:shrink-0 flex flex-col gap-6">
              {/* Location */}
              <div className="flex flex-col gap-1.5">
                <div className="h-5 w-12 skeleton" />
                <div className="h-5 w-36 skeleton" />
              </div>

              {/* Start Date */}
              <div className="flex flex-col gap-1.5">
                <div className="h-5 w-20 skeleton" />
                <div className="h-5 w-24 skeleton" />
              </div>

              {/* End Date */}
              <div className="flex flex-col gap-1.5">
                <div className="h-5 w-20 skeleton" />
                <div className="h-5 w-24 skeleton" />
              </div>
            </div>

            {/* Right Column - Description */}
            <div className="flex-1 flex flex-col gap-9">
              <div className="flex flex-col gap-1.5">
                <div className="h-5 w-24 skeleton" />
                <div className="flex flex-col gap-1">
                  <div className="h-5 w-full skeleton" />
                  <div className="h-5 w-full skeleton" />
                  <div className="h-5 w-3/4 skeleton" />
                  <div className="h-5 w-full skeleton" />
                  <div className="h-5 w-1/2 skeleton" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
