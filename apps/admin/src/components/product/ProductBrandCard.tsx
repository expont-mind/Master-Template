"use client";

import { Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Brand } from "./types";

interface ProductBrandCardProps {
  brandId: string | null;
  setBrandId: (brandId: string | null) => void;
  brands: Brand[];
  isLoading?: boolean;
}

export function ProductBrandCard({
  brandId,
  setBrandId,
  brands,
  isLoading,
}: ProductBrandCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Брэнд</CardTitle>
        <CardDescription>Бүтээгдэхүүний брэнд сонгох</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Select
            value={brandId || "none"}
            onValueChange={(v) => setBrandId(v === "none" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Брэнд сонгох" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Брэндгүй</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  );
}
