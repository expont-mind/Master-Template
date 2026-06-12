export default function SearchLoading() {
  return (
    <div className="max-w-[1064px] mx-auto py-4 px-4 md:py-6 md:px-6">
      {/* Top bar skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="h-6 md:h-7 w-48 md:w-64 skeleton" />
          <div className="h-4 w-32 skeleton mt-2" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 skeleton" />
          <div className="h-10 w-32 skeleton rounded-md" />
        </div>
      </div>

      {/* Mobile filter button skeleton */}
      <div className="md:hidden h-10 w-full skeleton rounded-md mb-4" />

      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        {/* Sidebar filters skeleton - hidden on mobile */}
        <aside className="hidden md:block w-[200px] shrink-0">
          <div className="flex flex-col gap-4">
            <div className="h-5 w-20 skeleton" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 skeleton" />
            ))}
            <div className="h-5 w-16 skeleton mt-4" />
            <div className="h-10 skeleton" />
            <div className="h-10 skeleton" />
          </div>
        </aside>

        {/* Main content skeleton */}
        <main className="flex-1 min-w-0">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2.5">
                <div className="w-full h-[200px] md:h-[340px] skeleton" />
                <div className="h-5 w-full skeleton" />
                <div className="h-5 w-2/3 skeleton" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
