"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
} from "@/constants";
import { OrderWithUser } from "./types";
import { parseAsUTC } from "@/lib/utils/formatters";

interface OrderRowProps {
  order: OrderWithUser;
}

export function OrderRow({ order }: OrderRowProps) {
  const itemCount =
    order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const formatDate = (dateString: string) => {
    return parseAsUTC(dateString).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ulaanbaatar",
    });
  };

  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex items-center gap-4 py-4 hover:bg-muted/50 -mx-4 px-4 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">#{order.id.slice(0, 8)}</span>
          <Badge
            variant="secondary"
            className={ORDER_STATUS_COLORS[order.status]}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
          <Badge
            variant="secondary"
            className={PAYMENT_STATUS_COLORS[order.payment_status]}
          >
            {PAYMENT_STATUS_LABELS[order.payment_status]}
          </Badge>
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
          <span>
            {[order.users?.first_name, order.users?.last_name].filter(Boolean).join(' ') || order.users?.email || "Хэрэглэгч"}
          </span>
          {order.users?.primary_phone && <span>{order.users.primary_phone}</span>}
          <span>{itemCount} бараа</span>
          <span>{formatDate(order.created_at)}</span>
        </div>
      </div>

      <div className="text-right">
        <div className="font-medium text-lg">
          ₮{order.total_amount.toLocaleString()}
        </div>
      </div>

      <div onClick={(e) => e.preventDefault()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/orders/${order.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Дэлгэрэнгүй
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Link>
  );
}
