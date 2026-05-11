// Loading skeleton shown before the cart store has hydrated from
// localStorage. Without this users would briefly see an "empty cart"
// flash even when their cart is non-empty.

export function CartSkeleton() {
  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full pb-[52px] px-4 xl:px-0">
        <p className="px-0.5 pb-2 pt-8 md:pt-[52px] text-[#020617] font-bold text-xl md:text-[26px] leading-9 font-manrope">
          Сагс
        </p>
        <div className="space-y-4 pt-8">
          <div className="h-6 w-32 skeleton" />
          <div className="h-24 skeleton" />
          <div className="h-24 skeleton" />
        </div>
      </div>
    </div>
  );
}
