import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { TopSellingProduct } from "./types";

interface TopSellingProductsProps {
  products: TopSellingProduct[];
}

export function TopSellingProducts({ products }: TopSellingProductsProps) {
  if (products.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
            Шилдэг бүтээгдэхүүн
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <Package className="h-8 w-8 mb-2" />
            <p className="text-sm">Мэдээлэл байхгүй</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
          Шилдэг бүтээгдэхүүн
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {products.map((product, index) => (
            <Link
              key={product.productId}
              href={`/products/${product.productId}`}
              className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <span
                className={`text-xs font-bold w-5 text-center shrink-0 ${
                  index < 3
                    ? "text-emerald-600"
                    : "text-muted-foreground"
                }`}
              >
                {index + 1}
              </span>
              <div className="h-8 w-8 shrink-0 rounded-md overflow-hidden bg-muted">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">
                  {product.name}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {product.unitsSold} ширхэг
                </p>
              </div>
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                ₮{product.revenue.toLocaleString()}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
