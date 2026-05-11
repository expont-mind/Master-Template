import { use } from "react";
import { WarehouseForm } from "@/components/warehouse";

export default function WarehouseEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <WarehouseForm id={id} />;
}
