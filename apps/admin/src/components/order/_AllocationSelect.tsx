"use client";

import { Loader2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WarehouseOption {
  id: string;
  name: string;
  name_color: string | null;
}

interface AllocationSelectProps {
  itemId: string;
  selectedValue: string;
  selectedWarehouse: WarehouseOption | undefined;
  isReturned: boolean;
  isAllocating: boolean;
  anyAllocating: boolean;
  warehouses: WarehouseOption[];
  onChange: (itemId: string, value: string) => void;
}

function ReturnedBadge() {
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">
      Буцаасан
    </span>
  );
}

function WarehouseBadge({ warehouse }: { warehouse: WarehouseOption }) {
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: warehouse.name_color || "#6b7280" }}
    >
      {warehouse.name}
    </span>
  );
}

function CurrentSelectionLabel({
  isReturned,
  warehouse,
}: {
  isReturned: boolean;
  warehouse: WarehouseOption | undefined;
}) {
  if (isReturned) return <ReturnedBadge />;
  if (warehouse) return <WarehouseBadge warehouse={warehouse} />;
  return <span className="text-muted-foreground">Сонгох</span>;
}

export function AllocationSelect({
  itemId,
  selectedValue,
  selectedWarehouse,
  isReturned,
  isAllocating,
  anyAllocating,
  warehouses,
  onChange,
}: AllocationSelectProps) {
  if (isAllocating) {
    return (
      <div className="h-8 w-[150px] flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <Select
      value={selectedValue}
      onValueChange={(v) => onChange(itemId, v)}
      disabled={anyAllocating}
    >
      <SelectTrigger className="h-8 w-[150px] text-xs">
        <SelectValue>
          <CurrentSelectionLabel isReturned={isReturned} warehouse={selectedWarehouse} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unselected">
          <span className="text-muted-foreground">Сонгох</span>
        </SelectItem>
        {warehouses.map((wh) => (
          <SelectItem key={wh.id} value={wh.id}>
            <div className="flex items-center gap-2">
              <WarehouseBadge warehouse={wh} />
            </div>
          </SelectItem>
        ))}
        <SelectItem value="returned">
          <ReturnedBadge />
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

export type { WarehouseOption };
