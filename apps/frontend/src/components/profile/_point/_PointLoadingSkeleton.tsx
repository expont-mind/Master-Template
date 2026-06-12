export function PointLoadingSkeleton() {
  return (
    <div className="flex flex-col mt-[-20px] md:mt-0">
      <div className="bg-slate-100 h-[220px] md:h-[200px]"></div>
      <div className="flex flex-col gap-3 px-4 md:px-0 pt-5 md:pt-10">
        <div className="flex flex-col gap-3">
          <div className="h-4 w-28 skeleton rounded" />
          <div className="flex gap-2">
            <div className="flex-1 h-8 skeleton rounded-full" />
            <div className="flex-1 h-8 skeleton rounded-full" />
            <div className="flex-1 h-8 skeleton rounded-full" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-14 skeleton rounded" />
          <div className="h-14 skeleton rounded" />
        </div>
      </div>
    </div>
  );
}
