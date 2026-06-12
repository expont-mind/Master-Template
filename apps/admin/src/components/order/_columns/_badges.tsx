"use client";

import { CheckCircle2, Clock, Package, PackageSearch, Truck, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DELIVERY_STATUS_LABELS,
  PAYMENT_METHOD_COLORS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/constants";

import type { DeliveryStatus, PaymentMethod, PaymentStatus } from "@/types/database";

export function getDeliveryStatusIcon(status: DeliveryStatus) {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4 text-amber-600" />;
    case "preparing":
      return <PackageSearch className="h-4 w-4 text-orange-600" />;
    case "confirmed":
      return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
    case "shipped":
      return <Truck className="h-4 w-4 text-slate-500" />;
    case "delivered":
      return <Package className="h-4 w-4 text-emerald-600" />;
    case "canceled":
      return <XCircle className="h-4 w-4 text-red-600" />;
  }
}

function getPaymentStatusIcon(status: PaymentStatus) {
  switch (status) {
    case "unpaid":
      return <Clock className="h-4 w-4 text-gray-600" />;
    case "processing":
      return <Clock className="h-4 w-4 text-amber-600" />;
    case "paid":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-600" />;
  }
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge
      variant="secondary"
      className="border border-border bg-background text-muted-foreground font-medium gap-1 rounded-lg px-1.5 py-0.5"
    >
      {getPaymentStatusIcon(status)}
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  return (
    <Badge
      variant="secondary"
      className="border border-border bg-background text-muted-foreground font-medium gap-1 rounded-lg px-1.5 py-0.5"
    >
      {getDeliveryStatusIcon(status)}
      {DELIVERY_STATUS_LABELS[status]}
    </Badge>
  );
}

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  const label = PAYMENT_METHOD_LABELS[method] || method;
  const colorClass = PAYMENT_METHOD_COLORS[method] || "bg-gray-100 text-gray-800";
  return (
    <Badge variant="secondary" className={`${colorClass} font-normal`}>
      {label}
    </Badge>
  );
}
