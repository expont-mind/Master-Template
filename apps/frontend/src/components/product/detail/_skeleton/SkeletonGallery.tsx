// Image gallery skeleton: thumbnails + main image + mobile thumb strip.

const THUMB_IDS = ["t1", "t2", "t3", "t4"] as const;

export function SkeletonGallery() {
  return (
    <div className="flex flex-col gap-0 md:gap-[10px] max-w-[640px]">
      <div className="flex flex-col md:flex-row gap-0 md:gap-4">
        {/* Thumbnails - desktop */}
        <div className="hidden md:flex flex-col gap-2 w-[96px] shrink-0">
          {THUMB_IDS.map((id) => (
            <div key={id} className="w-[96px] h-[120px] skeleton rounded-sm" />
          ))}
        </div>
        {/* Main image */}
        <div className="w-full md:w-[528px] h-[472px] md:h-[660px] skeleton md:rounded-sm" />
      </div>

      {/* Mobile thumbnails */}
      <div className="md:hidden flex gap-2 pl-[18px] pt-3 pb-1.5">
        {THUMB_IDS.map((id) => (
          <div key={id} className="w-[46px] h-[46px] skeleton rounded-[9px] shrink-0" />
        ))}
      </div>
    </div>
  );
}
