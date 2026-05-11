"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useOrderEdit } from "@/hooks/useOrderEdit";
import { OrderEditHeader } from "./OrderEditHeader";
import { OrderItemsCard } from "./OrderItemsCard";
import { OrderStatusCard } from "./OrderStatusCard";
import { OrderPaymentCard } from "./OrderPaymentCard";
import { OrderDeliveryServiceCard } from "./OrderDeliveryServiceCard";
import { OrderCustomerDeliveryCard } from "./OrderCustomerDeliveryCard";

interface OrderDetailsProps {
  id: string;
}

export function OrderDetails({ id }: OrderDetailsProps) {
  const {
    order,
    isLoading,
    isSavingDeliveryStatus,
    isSavingPaymentStatus,
    error,
    deliveryStatus,
    paymentStatus,
    hasDeliveryStatusChanges,
    hasPaymentStatusChanges,
    setDeliveryStatus,
    setPaymentStatus,
    handleSaveDeliveryStatus,
    handleSavePaymentStatus,
    warehouses,
    handleAllocateItem,
    allocatingItemId,
    pointTransactions,
  } = useOrderEdit(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-lg font-medium">Захиалга олдсонгүй</h3>
        <Link href="/orders">
          <Button variant="link">Буцах</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OrderEditHeader
        order={order}
        deliveryStatus={deliveryStatus}
        paymentStatus={paymentStatus}
      />

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-5 px-6">
        {/* Left column */}
        <div className="flex-1 space-y-5">
          {(() => {
            const subtotal = order.order_items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const couponDiscount = order.coupon_discount ?? order.coupon_usages?.[0]?.discount_amount ?? 0;
            const deliveryFee = order.delivery_fee ?? 0;
            // Actual point deduction/earning from point_transactions
            const actualPointsUsed = pointTransactions
              .filter((t) => t.type === "used")
              .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const pointsEarned = pointTransactions
              .filter((t) => t.type === "earned")
              .reduce((sum, t) => sum + t.amount, 0);
            return (
              <>
                <OrderItemsCard
                  items={order.order_items}
                  totalAmount={order.total_amount + couponDiscount + (order.points_used ?? 0)}
                  warehouses={warehouses}
                  onAllocate={handleAllocateItem}
                  allocatingItemId={allocatingItemId}
                />

                <OrderPaymentCard
                  totalAmount={order.total_amount}
                  subtotal={subtotal}
                  deliveryFee={deliveryFee}
                  couponDiscount={couponDiscount}
                  actualPointsUsed={actualPointsUsed}
                  pointsEarned={pointsEarned}
                  paymentMethod={order.payment_method}
                  paymentWallet={order.payment_invoices?.find((inv) => inv.payment_wallet)?.payment_wallet ?? undefined}
                />
              </>
            );
          })()}

          <OrderDeliveryServiceCard
            statusHistory={order.order_status_history || []}
            createdAt={order.created_at}
            paidAt={order.paid_at}
          />
        </div>

        <div className="w-[360px] space-y-5 shrink-0">
          <OrderStatusCard
            deliveryStatus={deliveryStatus}
            paymentStatus={paymentStatus}
            hasDeliveryStatusChanges={!!hasDeliveryStatusChanges}
            hasPaymentStatusChanges={!!hasPaymentStatusChanges}
            isSavingDeliveryStatus={isSavingDeliveryStatus}
            isSavingPaymentStatus={isSavingPaymentStatus}
            onDeliveryStatusChange={setDeliveryStatus}
            onPaymentStatusChange={setPaymentStatus}
            onSaveDeliveryStatus={handleSaveDeliveryStatus}
            onSavePaymentStatus={handleSavePaymentStatus}
          />

          <OrderCustomerDeliveryCard
            user={order.users}
            orderAddress={{
              city: order.delivery_city,
              district: order.delivery_district,
              sub_district: order.delivery_sub_district,
              detail: order.delivery_detail,
            }}
          />
        </div>
      </div>
    </div>
  );
}
