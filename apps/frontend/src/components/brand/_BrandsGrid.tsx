"use client";

import Image from "next/image";
import Link from "next/link";

import { SearchBig } from "@/components/svg";
import { MutedText, PrimaryMediumBase } from "@/components/ui/typography";
import { ROUTES } from "@/lib/utils/constants";

import type { Brand } from "@/lib/queries/brands";

interface BrandsGridProps {
  isLoading: boolean;
  brands: Brand[];
}

export function BrandsGrid({ isLoading, brands }: BrandsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 py-2">
        {["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "b10", "b11", "b12"].map((id) => (
          <div key={id} className="h-20 skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 py-2">
      {brands.map((brand) => (
        <BrandCard key={brand.id} brand={brand} />
      ))}
      {brands.length === 0 && (
        <div className="col-span-2 flex flex-col gap-4 items-center justify-center">
          <div className="p-[9px]">
            <SearchBig />
          </div>
          <MutedText>Хайлтад тохирох брэнд олдсонгүй</MutedText>
        </div>
      )}
    </div>
  );
}

function BrandCard({ brand }: { brand: Brand }) {
  return (
    <Link
      href={ROUTES.BRAND(brand.slug)}
      className="flex items-center h-[64px] justify-between pl-4 border border-border-light bg-surface hover:border-text-primary overflow-hidden rounded-lg transition-colors duration-200 cursor-pointer"
    >
      <div className="flex flex-col">
        <PrimaryMediumBase>{brand.name}</PrimaryMediumBase>
        <p className="text-text-secondary font-light text-xs font-manrope">
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
  );
}
