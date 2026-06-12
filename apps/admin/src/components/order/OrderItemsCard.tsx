"use client";

import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { type WarehouseOption } from "./_AllocationSelect";
import { OrderItemRow } from "./_OrderItemRow";
import { OrderItem } from "./types";

interface OrderItemsCardProps {
  items: OrderItem[];
  totalAmount: number;
  warehouses?: WarehouseOption[];
  onAllocate?: (itemId: string, warehouseId: string | null, isReturned: boolean) => void;
  allocatingItemId?: string | null;
}

function TotalsRow({ items, totalAmount }: { items: OrderItem[]; totalAmount: number }) {
  return (
    <TableRow className="border-b py-1">
      <TableCell className="px-4 py-2 font-semibold text-sm">Нийт дүн</TableCell>
      <TableCell className="p-2" />
      <TableCell className="p-2 font-semibold text-sm text-left">
        {items.reduce((sum, item) => sum + item.quantity, 0)} ш
      </TableCell>
      <TableCell className="p-2 font-semibold text-sm">{totalAmount.toLocaleString()}₮</TableCell>
      <TableCell className="p-2" />
    </TableRow>
  );
}

export function OrderItemsCard({
  items,
  totalAmount,
  warehouses = [],
  onAllocate,
  allocatingItemId,
}: OrderItemsCardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(name);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleAllocationChange = (itemId: string, value: string) => {
    if (!onAllocate) return;
    if (value === "returned") {
      onAllocate(itemId, null, true);
    } else if (value === "unselected") {
      onAllocate(itemId, null, false);
    } else {
      onAllocate(itemId, value, false);
    }
  };

  const sortedItems = [...items].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <Card className="md:col-span-2 pt-0 overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="w-[250px] font-medium text-foreground">Бүтээгдэхүүн</TableHead>
              <TableHead className="w-[160px] font-medium text-foreground">
                Бараа хуваарилалт
              </TableHead>
              <TableHead className="w-[80px] text-left font-medium text-foreground">
                Тоо ширхэг
              </TableHead>
              <TableHead className="w-[80px] font-medium text-foreground text-left">Үнэ</TableHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item) => (
              <OrderItemRow
                key={item.id}
                item={item}
                copiedId={copiedId}
                warehouses={warehouses}
                allocatingItemId={allocatingItemId}
                onCopy={handleCopy}
                onAllocationChange={handleAllocationChange}
              />
            ))}
            <TotalsRow items={items} totalAmount={totalAmount} />
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
