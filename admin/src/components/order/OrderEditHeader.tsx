"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Clock, XCircle, Truck, Package, Copy, Check } from "lucide-react";
import {
  DELIVERY_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/constants";
import { OrderDetails } from "./types";
import type { DeliveryStatus, PaymentStatus } from "@/types/database";

interface OrderEditHeaderProps {
  order: OrderDetails;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
}

// Helper function to get icon for delivery status
function getDeliveryStatusIcon(status: DeliveryStatus) {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4 text-amber-600" />;
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

// Helper function to get icon for payment status
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
    </Button>
  );
}

export function OrderEditHeader({
  order,
  deliveryStatus,
  paymentStatus,
}: OrderEditHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1 flex items-center gap-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Захиалга {order.order_number || order.id.slice(0, 8)}
        </h2>
        <CopyButton text={order.order_number || order.id.slice(0, 8)} />
      </div>
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className="border border-border bg-background text-muted-foreground font-medium gap-1 rounded-lg px-1.5 py-0.5"
        >
          {getDeliveryStatusIcon(deliveryStatus)}
          {DELIVERY_STATUS_LABELS[deliveryStatus]}
        </Badge>
        <Badge
          variant="secondary"
          className="border border-border bg-background text-muted-foreground font-medium gap-1 rounded-lg px-1.5 py-0.5"
        >
          {getPaymentStatusIcon(paymentStatus)}
          {PAYMENT_STATUS_LABELS[paymentStatus]}
        </Badge>
      </div>
    </div>
  );
}
