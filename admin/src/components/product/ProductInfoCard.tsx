"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Product } from "./types";

interface ProductInfoCardProps {
  product: Product;
}

export function ProductInfoCard({ product }: ProductInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Мэдээлэл</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Үүсгэсэн:</span>
          <span>
            {new Date(product.created_at).toLocaleDateString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Шинэчилсэн:</span>
          <span>
            {new Date(product.updated_at).toLocaleDateString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Variants:</span>
          <span>{product.product_variants?.length || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Зураг:</span>
          <span>{product.product_images?.length || 0}</span>
        </div>
      </CardContent>
    </Card>
  );
}
