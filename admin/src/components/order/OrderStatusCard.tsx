"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Package,
  CreditCard,
  AlertCircle,
  Hourglass,
  PackageSearch,
} from "lucide-react";
import {
  DELIVERY_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/constants";
import type {
  DeliveryStatus,
  PaymentStatus,
} from "@/types/database";

interface OrderStatusCardProps {
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  hasDeliveryStatusChanges: boolean;
  hasPaymentStatusChanges: boolean;
  isSavingDeliveryStatus: boolean;
  isSavingPaymentStatus: boolean;
  onDeliveryStatusChange: (value: DeliveryStatus) => void;
  onPaymentStatusChange: (value: PaymentStatus) => void;
  onSaveDeliveryStatus: () => void;
  onSavePaymentStatus: () => void;
}

// Helper function to get icon for delivery status
function getDeliveryStatusIcon(status: DeliveryStatus) {
  switch (status) {
    case "pending":
      return <Clock className="h-5 w-5" />;
    case "preparing":
      return <PackageSearch className="h-5 w-5" />;
    case "confirmed":
      return <CheckCircle2 className="h-5 w-5" />;
    case "shipped":
      return <Truck className="h-5 w-5" />;
    case "delivered":
      return <Package className="h-5 w-5" />;
    case "canceled":
      return <XCircle className="h-5 w-5" />;
  }
}

function getDeliveryStatusIconWithColor(status: DeliveryStatus) {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4 text-amber-600" />;
    case "preparing":
      return <PackageSearch className="h-4 w-4 text-orange-600" />;
    case "confirmed":
      return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
    case "shipped":
      return <Truck className="h-4 w-4 text-green-500" />;
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
      return <Clock className="h-5 w-5" />;
    case "processing":
      return <Hourglass className="h-5 w-5" />;
    case "paid":
      return <CheckCircle2 className="h-5 w-5" />;
    case "failed":
      return <XCircle className="h-5 w-5" />;
  }
}

function getPaymentStatusIconWithColor(status: PaymentStatus) {
  switch (status) {
    case "unpaid":
      return <Clock className="h-4 w-4 text-gray-600" />;
    case "processing":
      return <Hourglass className="h-4 w-4 text-amber-600" />;
    case "paid":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
  }
}

export function OrderStatusCard({
  deliveryStatus,
  paymentStatus,
  hasDeliveryStatusChanges,
  hasPaymentStatusChanges,
  isSavingDeliveryStatus,
  isSavingPaymentStatus,
  onDeliveryStatusChange,
  onPaymentStatusChange,
  onSaveDeliveryStatus,
  onSavePaymentStatus,
}: OrderStatusCardProps) {
  return (
    <div className="space-y-5">
      {/* Delivery Status Card */}
      <Card className="py-0 gap-0">
        <CardHeader className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-1.5">
            <Truck className="h-5 w-5" />
            <span className="text-sm font-semibold">Хүргэлтийн төлөв</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pt-1 pb-3">
          <div className="flex items-center gap-2">
            <Select
              value={deliveryStatus}
              onValueChange={(v) => onDeliveryStatusChange(v as DeliveryStatus)}
            >
              <SelectTrigger className="flex-1 h-9 shadow-sm">
                <SelectValue>
                  <span className="text-sm font-medium">
                    {DELIVERY_STATUS_LABELS[deliveryStatus]}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DELIVERY_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {getDeliveryStatusIconWithColor(key as DeliveryStatus)}
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={onSaveDeliveryStatus}
              disabled={!hasDeliveryStatusChanges || isSavingDeliveryStatus}
              className="h-9 w-9 p-0 bg-foreground hover:bg-foreground/90"
            >
              {isSavingDeliveryStatus ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                getDeliveryStatusIcon(deliveryStatus)
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status Card */}
      <Card className="py-0 gap-0">
        <CardHeader className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-5 w-5" />
            <span className="text-sm font-semibold">Төлбөрийн төлөв</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pt-1 pb-3">
          <div className="flex items-center gap-2">
            <Select
              value={paymentStatus}
              onValueChange={(v) => onPaymentStatusChange(v as PaymentStatus)}
            >
              <SelectTrigger className="flex-1 h-9 shadow-sm">
                <SelectValue>
                  <span className="text-sm font-medium">
                    {PAYMENT_STATUS_LABELS[paymentStatus]}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {getPaymentStatusIconWithColor(key as PaymentStatus)}
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={onSavePaymentStatus}
              disabled={!hasPaymentStatusChanges || isSavingPaymentStatus}
              className="h-9 w-9 p-0 bg-foreground hover:bg-foreground/90"
            >
              {isSavingPaymentStatus ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                getPaymentStatusIcon(paymentStatus)
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
