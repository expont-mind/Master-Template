"use client";

import { ArrowLeft, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUS_COLORS } from "@/constants";
import { getMonthOptions } from "@/lib/utils/date-range";

interface ProductSummary {
  name: string;
  imageUrl?: string | null;
  status: string;
  price: number;
  discountPrice?: number | null;
}

interface ProductSalesHeaderProps {
  product: ProductSummary;
  period: string;
  setPeriod: (v: string) => void;
  dateRange: { from?: Date; to?: Date };
  setCustomDateRange: (range: { from: Date; to: Date }) => void;
}

export function ProductSalesHeader({
  product,
  period,
  setPeriod,
  dateRange,
  setCustomDateRange,
}: ProductSalesHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <Link href="/analytics">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Буцах
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">{product.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                variant="secondary"
                className={
                  PRODUCT_STATUS_COLORS[product.status as keyof typeof PRODUCT_STATUS_COLORS] ?? ""
                }
              >
                {PRODUCT_STATUS_LABELS[product.status as keyof typeof PRODUCT_STATUS_LABELS] ??
                  product.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                ₮{product.price.toLocaleString()}
                {product.discountPrice && (
                  <span className="ml-1 text-red-600">
                    → ₮{product.discountPrice.toLocaleString()}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх хугацаа</SelectItem>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Сараар</SelectLabel>
              {getMonthOptions().map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectItem value="custom">Өөр хугацаа</SelectItem>
          </SelectContent>
        </Select>
        {period === "custom" && (
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onChange={(range) => {
              if (range.from && range.to) {
                setCustomDateRange({ from: range.from, to: range.to });
              }
            }}
            className="w-[280px]"
          />
        )}
      </div>
    </div>
  );
}
