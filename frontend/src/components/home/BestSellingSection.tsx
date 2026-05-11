"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "../product/ProductCard";
import { SectionTitle } from "./SectionTitle";
import { ChipFilter } from "./ChipFilter";
import { homeKeys, getBestSellingProducts } from "@/lib/queries/home";
import type { Product } from "@/types/database";

const chips = ["Сарын", "Улирлын", "Жилийн"];
const periodMap = ["30d", "90d", "365d"];

interface BestSellingSectionProps {
  initialProducts: Product[];
}

export const BestSellingSection = ({
  initialProducts,
}: BestSellingSectionProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const { data } = useQuery({
    queryKey: homeKeys.bestSelling(periodMap[activeIndex]),
    queryFn: () => getBestSellingProducts(periodMap[activeIndex], { limit: 10 }),
  });

  const displayProducts = data?.data ?? initialProducts;

  if (!displayProducts?.length) return null;

  const firstRow = displayProducts.slice(0, 5);
  const secondRow = displayProducts.slice(5, 10);

  return (
    <div className="w-full bg-white flex justify-center">
      <div className="pt-8 sm:pt-12 md:pt-16 pb-6 sm:pb-8 md:pb-10 flex flex-col gap-4 sm:gap-5 md:gap-7 px-4 md:px-0 max-w-[1064px] w-full">
        <SectionTitle title="Хамгийн их зарагдсан" />
        <ChipFilter
          chips={chips}
          activeIndex={activeIndex}
          onChange={setActiveIndex}
        />
        <div className="flex flex-col gap-8 pt-4">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {firstRow.map((product, i) => (
              <ProductCard
                variant="horizontal"
                key={product.id}
                product={product}
                rank={i + 1}
              />
            ))}
          </div>
          {secondRow.length > 0 && (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide">
              {secondRow.map((product, i) => (
                <ProductCard
                  variant="horizontal"
                  key={product.id}
                  product={product}
                  rank={i + 6}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
