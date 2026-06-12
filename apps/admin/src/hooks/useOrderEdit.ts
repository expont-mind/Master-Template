"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { OrderDetails } from "@/components/order/types";
import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import { useOrderEditAllocation } from "./_useOrderEditAllocation";
import { useOrderEditStatus } from "./_useOrderEditStatus";

interface WarehouseOption {
  id: string;
  name: string;
  name_color: string | null;
}

export function useOrderEdit(id: string) {
  const { data: order = null, isLoading } = useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () =>
      adminApi.getById<OrderDetails>("orders", id, {
        select:
          "id, user_id, order_number, status, delivery_status, total_amount, delivery_fee, points_used, coupon_id, coupon_discount, payment_status, payment_method, paid_at, created_at, updated_at, delivery_city, delivery_district, delivery_sub_district, delivery_detail, users(id, first_name, last_name, email, primary_phone, secondary_phone, addresses(id, city, district, sub_district, detail, is_default)), order_items(id, order_id, product_id, variant_id, variant_name, price, quantity, warehouse_id, is_returned, products(id, name, original_url, product_images(url, is_primary))), order_status_history(id, order_id, status_type, previous_status, new_status, changed_at), coupon_usages(discount_amount), payment_invoices(payment_wallet)",
      }),
  });

  const { data: pointTransactions = [] } = useQuery({
    queryKey: [...queryKeys.orders.detail(id), "point_transactions"],
    queryFn: () =>
      adminApi.getAll<{ type: string; amount: number }>("point_transactions", {
        select: "type, amount",
        filters: { "order_id.eq": id },
      }),
    enabled: !!order,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: [...queryKeys.warehouses.all, "options"],
    queryFn: () =>
      adminApi.getAll<WarehouseOption>("warehouses", {
        select: "id, name, name_color",
        filters: { "is_active.eq": "true" },
        order: "sort_order.asc",
      }),
  });

  const status = useOrderEditStatus(id, order);
  const allocation = useOrderEditAllocation(id, order);

  useEffect(() => {
    if (order) {
      status.setDeliveryStatus(order.delivery_status);
      status.setPaymentStatus(order.payment_status);
    }
    // status setters are stable refs; deps intentionally exclude them
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const hasDeliveryStatusChanges = order && status.deliveryStatus !== order.delivery_status;
  const hasPaymentStatusChanges = order && status.paymentStatus !== order.payment_status;

  return {
    order,
    isLoading,
    isSavingDeliveryStatus: status.isSavingDeliveryStatus,
    isSavingPaymentStatus: status.isSavingPaymentStatus,
    error: status.error,
    deliveryStatus: status.deliveryStatus,
    paymentStatus: status.paymentStatus,
    hasDeliveryStatusChanges,
    hasPaymentStatusChanges,
    setDeliveryStatus: status.setDeliveryStatus,
    setPaymentStatus: status.setPaymentStatus,
    handleSaveDeliveryStatus: status.handleSaveDeliveryStatus,
    handleSavePaymentStatus: status.handleSavePaymentStatus,
    warehouses,
    handleAllocateItem: allocation.handleAllocateItem,
    allocatingItemId: allocation.allocatingItemId,
    pointTransactions,
  };
}
