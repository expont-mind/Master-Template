"use client";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface BrandProductRowData {
  id: string;
  name: string;
  price: number;
  product_images?: { url: string }[];
}

interface BrandProductRowProps {
  product: BrandProductRowData;
  index: number;
}

export function BrandProductRow({ product, index }: BrandProductRowProps) {
  const imgUrl = product.product_images?.length ? product.product_images[0].url : null;

  return (
    <div
      className="group/row flex items-center border-b last:border-b-0 transition-colors duration-150 hover:bg-muted/30 animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
      style={{ animationDelay: `${index * 30}ms`, animationDuration: "250ms" }}
    >
      <div className="w-[56px] sm:w-[72px] shrink-0 p-2">
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgUrl}
            alt={product.name}
            className="h-10 w-10 sm:h-14 sm:w-14 rounded-md object-cover transition-transform duration-200 group-hover/row:scale-105"
          />
        ) : (
          <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-md bg-muted transition-colors duration-200" />
        )}
      </div>
      <div className="flex-1 px-2 min-w-0">
        <span className="text-sm truncate block">{product.name}</span>
      </div>
      <div className="w-[80px] sm:w-[110px] shrink-0 px-2">
        <span className="text-sm">{product.price?.toLocaleString()}₮</span>
      </div>
      <div className="w-[48px] shrink-0 hidden sm:flex justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover/row:opacity-100 transition-opacity duration-150"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
