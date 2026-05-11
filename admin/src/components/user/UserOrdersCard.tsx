"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingCart, Package } from "lucide-react";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from "@/constants";
import type { UserOrder } from "./types";
import { parseAsUTC } from "@/lib/utils/formatters";

interface UserOrdersCardProps {
  orders: UserOrder[];
}

export function UserOrdersCard({ orders }: UserOrdersCardProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return parseAsUTC(dateString).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Ulaanbaatar",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Захиалгын түүх
        </CardTitle>
        <CardDescription>Сүүлийн 20 захиалга</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Захиалга байхгүй</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Захиалга</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead>Төлбөр</TableHead>
                <TableHead className="text-right">Дүн</TableHead>
                <TableHead>Огноо</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">
                    #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={ORDER_STATUS_COLORS[order.status]}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={PAYMENT_STATUS_COLORS[order.payment_status]}
                    >
                      {PAYMENT_STATUS_LABELS[order.payment_status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₮{order.total_amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(order.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
