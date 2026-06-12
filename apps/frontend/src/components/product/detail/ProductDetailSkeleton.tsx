// Skeleton shown while the initial product detail query is loading.
// Mirrors the final layout (gallery, variants, sticky right panel,
// mobile bottom bar) so the page doesn't jump when content lands.
//
// Decomposed into _skeleton/* sub-components to keep this orchestrator
// short — each section mirrors a real section of ProductDetailClient.

import { SkeletonGallery } from "./_skeleton/SkeletonGallery";
import { SkeletonProductInfo } from "./_skeleton/SkeletonProductInfo";
import { SkeletonRightPanel } from "./_skeleton/SkeletonRightPanel";

export function ProductDetailSkeleton() {
  return (
    <div className="w-full bg-white flex justify-center">
      <div className="flex flex-col max-w-[1064px] w-full px-0 pb-0 md:pb-[200px]">
        {/* Breadcrumb - desktop only */}
        <div className="py-4 hidden md:flex items-center gap-1.5 px-4 xl:px-0">
          <div className="h-5 w-48 skeleton" />
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Left */}
          <div className="flex flex-col w-full md:max-w-[696px]">
            {/* Tabs */}
            <div className="flex items-center gap-8 sm:gap-6 px-4 md:px-0 mb-[10px]">
              <div className="h-10 w-[100px] skeleton" />
              <div className="h-10 w-[130px] skeleton" />
              <div className="h-10 w-[70px] skeleton" />
            </div>

            <SkeletonGallery />

            {/* Mobile: Product Info */}
            <div className="md:hidden flex flex-col gap-1 w-full px-4 pb-6">
              <div className="py-2">
                <div className="w-full h-px bg-border" />
              </div>
              <div className="flex flex-col gap-5">
                <SkeletonProductInfo />
              </div>
            </div>

            <div className="w-full h-2 bg-border-light block md:hidden" />
          </div>

          <SkeletonRightPanel />
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-border px-4 py-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex gap-3 items-center">
          <div className="w-14 h-14 skeleton rounded-sm" />
          <div className="flex-1 h-14 skeleton rounded-sm" />
        </div>
      </div>
    </div>
  );
}
