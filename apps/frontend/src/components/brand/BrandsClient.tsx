"use client";

import { Search } from "@/components/svg";
import { useBrands } from "@/lib/hooks/useBrands";

import { ALPHABET_DESKTOP, ALPHABET_MOBILE, BrandsAlphaSection } from "./_BrandsAlphaSection";
import { BrandsGrid } from "./_BrandsGrid";
import { useBrandsFilter } from "./_useBrandsFilter";

export function BrandsClient() {
  const { data: brands = [], isLoading } = useBrands();
  const { searchQuery, activeLetter, filteredBrands, handleLetterClick, handleSearchChange } =
    useBrandsFilter(brands);

  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0">
        <h1 className="px-0.5 pb-2 pt-5 md:pt-9 text-text-primary font-bold text-xl md:text-[26px] leading-9 font-manrope hidden md:block">
          Бренд
        </h1>

        <div className="flex flex-col lg:flex-row gap-3 lg:gap-16 py-0 md:py-4">
          {/* Left sidebar: Search + Alphabet */}
          <div className="w-full lg:w-[210px] shrink-0 flex flex-col gap-2 md:gap-1.5">
            {/* Search */}
            <div className="pt-3 md:pt-4 pb-0 md:pb-3">
              <div className="flex items-center gap-0.5 p-1.5 border border-border focus-within:border-text-primary rounded-full transition-colors duration-200">
                <div className="p-1.5">
                  <Search />
                </div>

                <input
                  type="text"
                  placeholder="Брэндийн нэрээр хайх"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full outline-none text-text-primary text-sm font-normal font-manrope placeholder:text-text-secondary"
                />
              </div>
            </div>

            <div className="py-2.5 hidden md:block">
              <div className="w-full h-px bg-border" />
            </div>

            <BrandsAlphaSection
              rows={ALPHABET_MOBILE}
              activeLetter={activeLetter}
              onLetterClick={handleLetterClick}
              variant="mobile"
            />

            <BrandsAlphaSection
              rows={ALPHABET_DESKTOP}
              activeLetter={activeLetter}
              onLetterClick={handleLetterClick}
              variant="desktop"
            />
          </div>

          {/* Right: Brand grid */}
          <div className="flex-1">
            <BrandsGrid isLoading={isLoading} brands={filteredBrands} />
          </div>
        </div>
      </div>
    </div>
  );
}
