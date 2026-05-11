"use client";

import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, PackageX } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InventoryAlert } from "./types";

interface InventoryAlertsProps {
  alerts: InventoryAlert[];
  isLoading: boolean;
}

export function InventoryAlerts({ alerts, isLoading }: InventoryAlertsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Нөөцийн анхааруулга
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] w-full animate-pulse rounded bg-muted" />
        ) : alerts.length === 0 ? (
          <div className="flex items-center justify-center h-[120px] text-muted-foreground">
            Нөөц дуусах бүтээгдэхүүн байхгүй байна
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.map((item) => (
              <Link
                key={item.productId}
                href={`/products/${item.productId}`}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="h-10 w-10 shrink-0 rounded-md bg-muted overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <PackageX className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Нөөц: {item.stock} · Захиалсан: {item.reserved}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    item.stock === 0
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {item.stock === 0 ? "Дууссан" : "Бага нөөц"}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
