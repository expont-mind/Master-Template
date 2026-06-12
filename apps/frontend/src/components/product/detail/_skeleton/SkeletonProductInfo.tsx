// Brand + name + rating + price + description placeholders + variant
// option skeleton. Used inline on mobile only — desktop has its own
// composition in SkeletonRightPanel.

const RATING_STARS = ["s1", "s2", "s3", "s4", "s5"] as const;
const VARIANT_PLACEHOLDERS = ["v1", "v2", "v3"] as const;

export function SkeletonProductInfo() {
  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-[34px] h-[34px] rounded-full skeleton" />
            <div className="h-5 w-24 skeleton" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="h-7 w-full skeleton" />
            <div className="h-7 w-2/3 skeleton" />
          </div>
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {RATING_STARS.map((id) => (
                <div key={id} className="w-4 h-4 skeleton rounded-sm" />
              ))}
            </div>
            <div className="h-4 w-6 skeleton" />
            <div className="h-4 w-16 skeleton" />
          </div>
        </div>
        <div className="flex items-end gap-1">
          <div className="h-8 w-12 skeleton" />
          <div className="h-8 w-28 skeleton" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-5 w-full skeleton" />
          <div className="h-5 w-3/4 skeleton" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-5 w-20 skeleton" />
        <div className="flex gap-2">
          {VARIANT_PLACEHOLDERS.map((id) => (
            <div key={id} className="h-10 w-20 skeleton rounded-sm" />
          ))}
        </div>
      </div>
    </>
  );
}
