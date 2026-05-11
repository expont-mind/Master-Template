"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, SearchBig } from "@/components/svg";
import { useBrands } from "@/lib/hooks/useBrands";
import { ROUTES } from "@/lib/utils/constants";

// Desktop: 4 rows of 7
const ALPHABET_DESKTOP = [
  ["A", "B", "C", "D", "E", "F", "G"],
  ["H", "I", "J", "K", "L", "M", "N"],
  ["O", "P", "Q", "R", "S", "T", "U"],
  ["V", "W", "X", "Y", "Z", "#", " "],
];

// Mobile: 3 rows (11, 11, 5)
const ALPHABET_MOBILE = [
  ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"],
  ["L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V"],
  ["W", "X", "Y", "Z", "#", " ", " ", " ", " ", " ", " "],
];

export function BrandsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const { data: brands = [], isLoading: isBrandsLoading } = useBrands();

  const filteredBrands = useMemo(() => {
    let result = brands;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((brand) =>
        brand.name.toLowerCase().includes(query),
      );
    }

    if (activeLetter) {
      if (activeLetter === "#") {
        result = result.filter((brand) => !/^[A-Za-z]/.test(brand.name));
      } else {
        result = result.filter((brand) =>
          brand.name.toUpperCase().startsWith(activeLetter),
        );
      }
    }

    return result;
  }, [searchQuery, activeLetter, brands]);

  const handleLetterClick = (letter: string) => {
    setActiveLetter((prev) => (prev === letter ? null : letter));
  };

  const isLoading = isBrandsLoading;

  return (
    <div className="w-full bg-white flex justify-center min-h-screen">
      <div className="flex flex-col max-w-[1064px] w-full px-4 xl:px-0">
        <h1 className="px-0.5 pb-2 pt-5 md:pt-9 text-[#020617] font-bold text-xl md:text-[26px] leading-9 font-manrope hidden md:block">
          Бренд
        </h1>

        <div className="flex flex-col lg:flex-row gap-3 lg:gap-16 py-0 md:py-4">
          {/* Left sidebar: Search + Alphabet */}
          <div className="w-full lg:w-[210px] shrink-0 flex flex-col gap-2 md:gap-1.5">
            {/* Search */}
            <div className="pt-3 md:pt-4 pb-0 md:pb-3">
              <div className="flex items-center gap-0.5 p-1.5 border border-[#E2E8F0] focus-within:border-[#020617] rounded-full transition-colors duration-200">
                <div className="p-1.5">
                  <Search />
                </div>

                <input
                  type="text"
                  placeholder="Брэндийн нэрээр хайх"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setActiveLetter(null);
                  }}
                  className="w-full outline-none text-[#020617] text-sm font-normal font-manrope placeholder:text-[#64748B]"
                />
              </div>
            </div>

            <div className="py-2.5 hidden md:block">
              <div className="w-full h-px bg-[#E2E8F0]" />
            </div>

            {/* Alphabet grid - Mobile */}
            <div className="flex flex-col gap-x-3 gap-y-1 pt-2 md:hidden">
              {ALPHABET_MOBILE.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-between">
                  {row.map((letter, letterIndex) =>
                    letter.trim() ? (
                      <button
                        key={letter}
                        onClick={() => handleLetterClick(letter)}
                        className={`w-5 h-6 flex items-center justify-center text-base font-medium font-manrope rounded-lg cursor-pointer transition-colors ${
                          activeLetter === letter
                            ? "bg-[#020617] text-white"
                            : "text-[#64748B] hover:bg-[#F1F5F9]"
                        }`}
                      >
                        {letter}
                      </button>
                    ) : (
                      <span key={`empty-${letterIndex}`} className="w-5 h-6" />
                    ),
                  )}
                </div>
              ))}
            </div>

            {/* Alphabet grid - Desktop */}
            <div className="hidden md:flex flex-col gap-1 py-3">
              {ALPHABET_DESKTOP.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1">
                  {row.map((letter, letterIndex) =>
                    letter.trim() ? (
                      <button
                        key={letter}
                        onClick={() => handleLetterClick(letter)}
                        className={`w-8 h-8 flex items-center justify-center text-base font-medium font-manrope rounded-sm cursor-pointer transition-colors ${
                          activeLetter === letter
                            ? "bg-[#020617] text-white"
                            : "text-[#020617] hover:bg-[#F1F5F9]"
                        }`}
                      >
                        {letter}
                      </button>
                    ) : (
                      <span key={`empty-${letterIndex}`} className="w-8 h-8" />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Brand grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 py-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 skeleton"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 py-2">
                {filteredBrands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={ROUTES.BRAND(brand.slug)}
                    className="flex items-center h-[64px] justify-between pl-4 border border-[#F1F5F9] bg-[#F8FAFC] hover:border-[#020617] overflow-hidden rounded-lg transition-colors duration-200 cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <p className="text-[#020617] font-medium text-base font-manrope">
                        {brand.name}
                      </p>
                      <p className="text-[#64748B] font-light text-xs font-manrope">
                        {brand.type ?? "Бусад"}
                      </p>
                    </div>
                    {brand.logo_url && (
                      <div className="px-2 bg-white w-[96px] h-[64px] relative flex items-center justify-center">
                        <Image
                          src={brand.logo_url}
                          alt={brand.name}
                          width={96}
                          height={64}
                          className="max-w-[96px] max-h-[64px] object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                  </Link>
                ))}
                {filteredBrands.length === 0 && (
                  <div className="col-span-2 flex flex-col gap-4 items-center justify-center">
                    <div className="p-[9px]">
                      <SearchBig />
                    </div>
                    <p className="text-[#64748B] font-normal text-base font-manrope">
                      Хайлтад тохирох брэнд олдсонгүй
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
