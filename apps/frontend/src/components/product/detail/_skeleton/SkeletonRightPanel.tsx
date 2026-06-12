// Desktop-only right panel skeleton with brand/name/price/variant info
// followed by total + add-to-cart placeholders.

const RATING_STARS = ["s1", "s2", "s3", "s4", "s5"] as const;
const VARIANT_SLOTS = ["v1", "v2", "v3"] as const;

export function SkeletonRightPanel() {
  return (
    <div className="hidden md:flex flex-col gap-5 w-full md:max-w-[368px]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-[14px]">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-[34px] h-[34px] rounded-full skeleton" />
              <div className="h-5 w-24 skeleton" />
            </div>
            <div className="flex flex-col gap-2">
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
        <div className="py-2">
          <div className="w-full h-px bg-border" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="h-5 w-20 skeleton" />
          <div className="flex gap-2">
            {VARIANT_SLOTS.map((id) => (
              <div key={id} className="h-10 w-20 skeleton rounded-sm" />
            ))}
          </div>
        </div>
      </div>
      <div className="py-2">
        <div className="w-full h-px bg-border" />
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex justify-end items-end gap-3 px-0.5">
          <div className="h-5 w-32 skeleton" />
          <div className="h-6 w-24 skeleton" />
        </div>
        <div className="flex gap-3 md:pl-2 items-center">
          <div className="w-11 h-11 skeleton rounded-sm" />
          <div className="flex-1 h-11 skeleton rounded-sm" />
        </div>
      </div>
    </div>
  );
}
