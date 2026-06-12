export default function ArticleDetailLoading() {
  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0 pb-20 md:pb-[52px]">
        {/* Breadcrumb */}
        <div className="flex flex-col py-2.5 md:pt-8 md:pb-2">
          <div className="flex items-center gap-1.5 px-1">
            <div className="h-4 w-14 skeleton" />
            <div className="h-4 w-4 skeleton" />
            <div className="h-4 w-20 skeleton" />
          </div>
          {/* Title - desktop */}
          <div className="hidden md:block h-9 w-80 skeleton mt-1 px-0.5" />
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 mt-4">
          {/* Left Column - Main Content */}
          <div className="flex-1 flex gap-4">
            {/* Social Icons Sidebar */}
            <div className="hidden md:flex flex-col gap-4 pt-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-8 h-8 skeleton rounded-full" />
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-6">
              {/* Main Image */}
              <div className="w-full aspect-[3/2] skeleton rounded-sm" />

              {/* Published Date */}
              <div className="flex flex-col gap-1.5">
                <div className="h-5 w-28 skeleton" />
                <div className="h-5 w-24 skeleton" />
              </div>

              {/* Article Content */}
              <div className="flex flex-col gap-1.5">
                <div className="h-5 w-24 skeleton" />
                <div className="flex flex-col gap-1">
                  <div className="h-5 w-full skeleton" />
                  <div className="h-5 w-full skeleton" />
                  <div className="h-5 w-3/4 skeleton" />
                  <div className="h-5 w-full skeleton" />
                  <div className="h-5 w-full skeleton" />
                  <div className="h-5 w-1/2 skeleton" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Related Articles */}
          <div className="w-full lg:w-[280px] flex flex-col gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="w-full aspect-[3/2] skeleton rounded-sm" />
                <div className="flex flex-col gap-1">
                  <div className="h-4 w-full skeleton" />
                  <div className="h-3 w-20 skeleton" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
