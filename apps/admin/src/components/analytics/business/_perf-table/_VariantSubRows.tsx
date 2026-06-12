"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { TableCell, TableRow } from "@/components/ui/table";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import type { VariantSalesRow } from "./_types";

interface VariantSubRowsProps {
  productId: string;
  dateFrom: string;
  dateTo: string;
  colSpan: number;
}

function VariantPriceCell({ price, discount }: { price: number; discount: number | null }) {
  if (discount) {
    return (
      <div className="text-right">
        <span className="text-xs text-muted-foreground line-through">
          ₮{price.toLocaleString()}
        </span>
        <span className="ml-1 font-medium text-red-600">₮{discount.toLocaleString()}</span>
      </div>
    );
  }
  return <div className="text-right">₮{price.toLocaleString()}</div>;
}

function stockClassName(stock: number): string {
  if (stock === 0) return "text-red-600 font-medium";
  if (stock <= 5) return "text-yellow-600 font-medium";
  return "";
}

function VariantRow({ v }: { v: VariantSalesRow }) {
  return (
    <TableRow className="bg-muted/30 text-sm">
      <TableCell>
        <span className="pl-8 text-muted-foreground">{v.variant_name || "—"}</span>
      </TableCell>
      <TableCell>
        <VariantPriceCell price={v.price} discount={v.discount_price} />
      </TableCell>
      <TableCell />
      <TableCell>
        <div className="text-right">{v.qty_sold.toLocaleString()}</div>
      </TableCell>
      <TableCell>
        <div className="text-right">₮{v.revenue.toLocaleString()}</div>
      </TableCell>
      <TableCell>
        <div className="text-right">
          <span className={stockClassName(v.stock_quantity)}>{v.stock_quantity}</span>
        </div>
      </TableCell>
      <TableCell />
      <TableCell />
    </TableRow>
  );
}

export function VariantSubRows({ productId, dateFrom, dateTo, colSpan }: VariantSubRowsProps) {
  const { data: variants, isLoading } = useQuery({
    queryKey: queryKeys.analytics.variantSales(productId, dateFrom, dateTo),
    queryFn: () =>
      adminApi.rpc<VariantSalesRow[]>("get_variant_sales", {
        p_product_id: productId,
        p_date_from: dateFrom,
        p_date_to: dateTo,
      }),
  });

  if (isLoading) {
    return (
      <TableRow className="bg-muted/30">
        <TableCell colSpan={colSpan}>
          <div className="flex items-center gap-2 pl-8 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Ачааллаж байна...
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (!variants || variants.length === 0) {
    return (
      <TableRow className="bg-muted/30">
        <TableCell colSpan={colSpan}>
          <div className="pl-8 py-2 text-sm text-muted-foreground">Опцион олдсонгүй</div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {variants.map((v) => (
        <VariantRow key={v.variant_id} v={v} />
      ))}
    </>
  );
}
