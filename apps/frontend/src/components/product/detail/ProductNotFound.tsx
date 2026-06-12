import { MutedTextSm } from "@/components/ui/typography";

/**
 * Empty state shown when the product query resolved but returned no
 * product (deleted/inactive product, bad slug). Distinct from the
 * loading skeleton so search-engine bots see a stable "not found"
 * marker instead of a flash of skeleton UI.
 */
export function ProductNotFound() {
  return (
    <div className="w-full bg-white flex justify-center">
      <div className="flex flex-col items-center justify-center max-w-[1064px] w-full py-20">
        <MutedTextSm>Бүтээгдэхүүн олдсонгүй</MutedTextSm>
      </div>
    </div>
  );
}
