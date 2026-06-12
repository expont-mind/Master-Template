"use client";

import { Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { ReviewWithDetails } from "./types";

interface ReviewProductCardProps {
  review: ReviewWithDetails;
  productImage: string | null;
}

export function ReviewProductCard({ review, productImage }: ReviewProductCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Бүтээгдэхүүн
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
            {productImage ? (
              <Image
                src={productImage}
                alt={review.products?.name ?? ""}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <Package className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium">{review.products?.name || "Бүтээгдэхүүн"}</p>
            {review.products?.price && (
              <p className="text-sm text-muted-foreground">
                ₮{review.products.price.toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <Link href={`/products/${review.product_id}`}>
          <Button variant="outline" size="sm" className="w-full">
            Бүтээгдэхүүнийг харах
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
