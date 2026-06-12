"use client";

import { Loader2, Package } from "lucide-react";
import Link from "next/link";

export interface CategoryProductRow {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
  images?: string[];
  product_images?: { url: string }[];
}

function getImageUrl(product: CategoryProductRow): string | null {
  if (product.product_images?.length) return product.product_images[0].url;
  return null;
}

function ProductRowItem({ product, index }: { product: CategoryProductRow; index: number }) {
  const imgUrl = getImageUrl(product);
  return (
    <Link
      href={`/products/${product.id}`}
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
        <span className="text-sm">
          {(product.discount_price ?? product.price)?.toLocaleString()}₮
        </span>
      </div>
      <div className="w-[80px] sm:w-[110px] shrink-0 px-2 hidden sm:block">
        {product.discount_price ? (
          <span className="text-sm text-muted-foreground line-through">
            {product.price?.toLocaleString()}₮
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </div>
    </Link>
  );
}

export function CategoryProductsTable({
  products,
  isLoading,
}: {
  products: CategoryProductRow[];
  isLoading: boolean;
}) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="flex items-center border-b text-sm font-medium text-muted-foreground">
        <div className="w-[56px] sm:w-[72px] shrink-0 py-2.5 px-2">Зураг</div>
        <div className="flex-1 py-2.5 px-2">Нэр</div>
        <div className="w-[80px] sm:w-[110px] shrink-0 py-2.5 px-2">Үнэ</div>
        <div className="w-[80px] sm:w-[110px] shrink-0 py-2.5 px-2 hidden sm:block">Бодит үнэ</div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 animate-in fade-in duration-300">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-300">
          <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Бүтээгдэхүүн олдсонгүй</p>
        </div>
      ) : (
        products.map((product, index) => (
          <ProductRowItem key={product.id} product={product} index={index} />
        ))
      )}
    </div>
  );
}
