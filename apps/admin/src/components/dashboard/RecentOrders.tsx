import { Package, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from "@/constants";

import { getFullName, formatDate, getProductImage } from "./helpers";

import type { RecentOrder } from "./types";

interface RecentOrdersProps {
  orders: RecentOrder[];
  isFiltered: boolean;
}

export function RecentOrders({ orders, isFiltered }: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{isFiltered ? "Захиалгууд" : "Сүүлийн захиалгууд"}</CardTitle>
        <Link
          href="/orders"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Бүх захиалга →
        </Link>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <ShoppingCart className="h-8 w-8 mb-2" />
            <p>Захиалга байхгүй байна</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const firstItem = order.order_items[0];
              const productImage = firstItem ? getProductImage(firstItem.products) : null;
              const productName = firstItem?.products?.name;
              const itemCount = order.order_items.length;

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border hover:bg-muted/50 transition-colors overflow-hidden"
                >
                  <div className="relative h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-md overflow-hidden bg-muted">
                    {productImage ? (
                      <Image
                        src={productImage}
                        alt={productName || "Product"}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    {itemCount > 1 && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        +{itemCount - 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden space-y-0.5 sm:space-y-1">
                    <p className="text-xs sm:text-sm font-medium line-clamp-1">
                      {productName || "Бүтээгдэхүүн байхгүй"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate hidden sm:block">
                      {getFullName(order.users)}
                    </p>
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0 ${ORDER_STATUS_COLORS[order.status]}`}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0 ${PAYMENT_STATUS_COLORS[order.payment_status]}`}
                      >
                        {PAYMENT_STATUS_LABELS[order.payment_status]}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs sm:text-sm font-medium whitespace-nowrap">
                      ₮{order.total_amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
