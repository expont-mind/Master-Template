"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { Warehouse } from "./types";

interface WarehouseInfoCardProps {
  warehouse: Warehouse;
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ulaanbaatar",
  });
}

export function WarehouseInfoCard({ warehouse }: WarehouseInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Мэдээлэл</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">ID</span>
          <span className="font-mono text-xs">{warehouse.id.slice(0, 8)}...</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Үүсгэсэн</span>
          <span>{formatDateTime(warehouse.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Шинэчлэгдсэн</span>
          <span>{formatDateTime(warehouse.updated_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
