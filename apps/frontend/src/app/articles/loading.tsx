export default function ArticlesLoading() {
  return (
    <div className="w-full bg-white flex justify-center">
      <div className="flex flex-col items-center max-w-[1064px] w-full pb-[52px] px-4 xl:px-0 gap-7">
        <div className="pb-2 pt-8 md:pt-[52px] flex items-center gap-0.5 w-full">
          <p className="px-0.5 text-text-primary font-bold text-xl md:text-[26px] leading-9 font-manrope">
            Нийтлэл
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="w-full aspect-[3/2] skeleton rounded-lg" />
              <div className="flex flex-col gap-1.5">
                <div className="h-6 w-full skeleton" />
                <div className="h-4 w-24 skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
