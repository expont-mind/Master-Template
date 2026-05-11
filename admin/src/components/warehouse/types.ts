import type { Tables, WarehouseType } from "@/types/database";

export type Warehouse = Tables<"warehouses">;
export type WarehouseInventory = Tables<"warehouse_inventory">;

export const WAREHOUSE_TYPES: { value: WarehouseType; label: string }[] = [
  { value: "main", label: "Үндсэн агуулах" },
  { value: "secondary", label: "Туслах агуулах" },
  { value: "distribution", label: "Түгээлтийн агуулах" },
];

export const WAREHOUSE_TYPE_LABELS: Record<WarehouseType, string> = {
  main: "Үндсэн",
  secondary: "Туслах",
  distribution: "Түгээлт",
};
