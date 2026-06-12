"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ProductCard } from "@/components/product/ProductCard";
import { homeKeys, getBrandProducts } from "@/lib/queries/home";

import { ChipFilter } from "./ChipFilter";
import { SectionTitle } from "./SectionTitle";

import type { Product } from "@/types/database";

interface BrandGridSectionProps {
  initialProducts: Product[];
  chips: string[];
}

export const BrandGridSection = ({ initialProducts, chips }: BrandGridSectionProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: products } = useQuery({
    queryKey: homeKeys.brandProducts(chips[activeIndex]),
    queryFn: () => getBrandProducts(chips[activeIndex], 20),
    initialData: activeIndex === 0 ? initialProducts : undefined,
  });

  const displayProducts = products ?? initialProducts;

  if (!displayProducts?.length) return null;

  const firstRow = displayProducts.slice(0, 10);
  const secondRow = displayProducts.slice(10, 20);

  return (
    <div className="w-full bg-white flex justify-center">
      <div className="pt-8 sm:pt-12 md:pt-16 pb-6 sm:pb-8 md:pb-10 flex flex-col gap-4 sm:gap-5 md:gap-7 px-4 md:px-0 max-w-[1064px] w-full">
        <SectionTitle title="Брэндүүд" />
        <div className="flex flex-col gap-5">
          <ChipFilter chips={chips} activeIndex={activeIndex} onChange={setActiveIndex} />
          <div className="flex flex-col gap-6">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide">
              {firstRow.map((product) => (
                <ProductCard variant="small" key={product.id} product={product} />
              ))}
            </div>
            {secondRow.length > 0 && (
              <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                {secondRow.map((product) => (
                  <ProductCard variant="small" key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
