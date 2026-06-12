"use client";

import { Check, Copy, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { TableCell, TableRow } from "@/components/ui/table";

import { AllocationSelect, type WarehouseOption } from "./_AllocationSelect";

import type { OrderItem } from "./types";

interface OrderItemRowProps {
  item: OrderItem;
  copiedId: string | null;
  warehouses: WarehouseOption[];
  allocatingItemId: string | null | undefined;
  onCopy: (e: React.MouseEvent, id: string, name: string) => void;
  onAllocationChange: (itemId: string, value: string) => void;
}

function getSelectValue(item: OrderItem): string {
  if (item.is_returned) return "returned";
  if (item.warehouse_id) return item.warehouse_id;
  return "unselected";
}

function ProductCell({ item }: { item: OrderItem }) {
  const primaryImage = item.products?.product_images?.find((img) => img.is_primary);
  return (
    <TableCell className="p-2">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage.url}
              alt={item.products?.name || ""}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {item.products?.name || "Устгагдсан бараа"}
          </div>
          {item.variant_name && (
            <div className="text-sm text-muted-foreground truncate">{item.variant_name}</div>
          )}
        </div>
      </div>
    </TableCell>
  );
}

export function OrderItemRow({
  item,
  copiedId,
  warehouses,
  allocatingItemId,
  onCopy,
  onAllocationChange,
}: OrderItemRowProps) {
  const router = useRouter();
  const selectedValue = getSelectValue(item);
  const selectedWarehouse = warehouses.find((w) => w.id === item.warehouse_id);

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => router.push(`/products/${item.product_id}`)}
    >
      <ProductCell item={item} />
      <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
        <AllocationSelect
          itemId={item.id}
          selectedValue={selectedValue}
          selectedWarehouse={selectedWarehouse}
          isReturned={item.is_returned}
          isAllocating={allocatingItemId === item.id}
          anyAllocating={!!allocatingItemId}
          warehouses={warehouses}
          onChange={onAllocationChange}
        />
      </TableCell>
      <TableCell className="p-2">
        <span className="text-sm">{item.quantity}</span>
      </TableCell>
      <TableCell className="p-2">
        <span className="text-sm">{(item.price * item.quantity).toLocaleString()}₮</span>
      </TableCell>
      <TableCell className="p-2">
        <button
          type="button"
          onClick={(e) => onCopy(e, item.id, item.products?.name || "")}
          className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Нэр хуулах"
        >
          {copiedId === item.id ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </TableCell>
    </TableRow>
  );
}
