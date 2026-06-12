"use client";

import { Package } from "lucide-react";

import { hasMultipleVariants, type GroupedProduct } from "./_productGrouping";

function ProductRow({ group, rowIndex }: { group: GroupedProduct; rowIndex: number }) {
  const multiple = hasMultipleVariants(group);
  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
      <td className="px-3 py-2 text-center text-sm text-muted-foreground align-top">{rowIndex}</td>
      <td className="px-3 py-2 align-top">
        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
          {group.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={group.imageUrl}
              alt={group.productName}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="text-sm font-medium">{group.productName}</div>
        {multiple && (
          <div className="mt-1 space-y-0.5">
            {group.variants.map((v) => (
              <div
                key={v.variantName ?? "no-variant"}
                className="flex items-center justify-between text-xs text-muted-foreground pl-2 border-l-2 border-muted"
              >
                <span>{v.variantName || "-"}</span>
                <span className="font-medium text-foreground">{v.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </td>
      <td className="px-3 py-2 text-right align-top">
        <span className="text-sm font-semibold">{group.totalQuantity}</span>
      </td>
    </tr>
  );
}

interface OrderProductsTableProps {
  paginatedGroups: GroupedProduct[];
  page: number;
  pageSize: number;
}

export function OrderProductsTable({ paginatedGroups, page, pageSize }: OrderProductsTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="w-10 px-3 py-2 text-center text-sm font-medium">#</th>
            <th className="w-14 px-3 py-2" />
            <th className="text-left px-3 py-2 text-sm font-medium">Бараа</th>
            <th className="text-right px-3 py-2 text-sm font-medium w-20">Тоо</th>
          </tr>
        </thead>
        <tbody>
          {paginatedGroups.map((group, idx) => (
            <ProductRow
              key={group.productName}
              group={group}
              rowIndex={page * pageSize + idx + 1}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
