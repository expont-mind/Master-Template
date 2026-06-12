"use client";

import { format } from "date-fns";
import { mn } from "date-fns/locale";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DELIVERY_STATUS_COLORS,
  DELIVERY_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
} from "@/constants";

interface RecentOrder {
  itemId: string;
  orderId: string;
  date: string;
  qty: number;
  unitPrice: number;
  total: number;
  paymentStatus: string;
  deliveryStatus: string;
}

function StatusBadge({
  status,
  colorMap,
  labelMap,
}: {
  status: string;
  colorMap: Record<string, string>;
  labelMap: Record<string, string>;
}) {
  return (
    <Badge variant="secondary" className={colorMap[status] ?? ""}>
      {labelMap[status] ?? status}
    </Badge>
  );
}

function OrderRow({ order }: { order: RecentOrder }) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-3 pr-4">
        <Link href={`/orders/${order.orderId}`} className="hover:underline font-medium text-xs">
          {order.orderId.slice(0, 8)}...
        </Link>
      </td>
      <td className="py-3 pr-4 text-muted-foreground">
        {format(new Date(order.date), "yyyy.MM.dd HH:mm", { locale: mn })}
      </td>
      <td className="py-3 pr-4 text-right">{order.qty}</td>
      <td className="py-3 pr-4 text-right">₮{order.unitPrice.toLocaleString()}</td>
      <td className="py-3 pr-4 text-right font-medium">₮{order.total.toLocaleString()}</td>
      <td className="py-3 pr-4">
        <StatusBadge
          status={order.paymentStatus}
          colorMap={PAYMENT_STATUS_COLORS}
          labelMap={PAYMENT_STATUS_LABELS}
        />
      </td>
      <td className="py-3">
        <StatusBadge
          status={order.deliveryStatus}
          colorMap={DELIVERY_STATUS_COLORS}
          labelMap={DELIVERY_STATUS_LABELS}
        />
      </td>
    </tr>
  );
}

export function ProductRecentOrdersTable({ orders }: { orders: RecentOrder[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Сүүлийн захиалгууд</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Захиалга байхгүй байна
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Захиалга</th>
                  <th className="pb-3 pr-4 font-medium">Огноо</th>
                  <th className="pb-3 pr-4 font-medium text-right">Тоо</th>
                  <th className="pb-3 pr-4 font-medium text-right">Нэгж үнэ</th>
                  <th className="pb-3 pr-4 font-medium text-right">Нийт</th>
                  <th className="pb-3 pr-4 font-medium">Төлбөр</th>
                  <th className="pb-3 font-medium">Хүргэлт</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <OrderRow key={order.itemId} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
