"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { log } from "@/lib/observability/log";
import { OrderDetails } from "@/components/order/types";
import type { DeliveryStatus, PaymentStatus } from "@/types/database";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

interface WarehouseOption {
  id: string;
  name: string;
  name_color: string | null;
}

interface RefundResult {
  success: boolean;
  error?: string;
  already_refunded?: boolean;
  current_balance?: number;
  required?: number;
}

async function refundOrderPointsAndCoupon(order: OrderDetails) {
  // Single-transaction RPC. Replaces the previous read-modify-write
  // chain that races when two admins edit the same order simultaneously
  // and that could drive a user's point balance negative on a
  // double-refund. The RPC also enforces a balance check before
  // deducting earned-points reversal.
  const result = await adminApi.rpc<RefundResult>(
    "refund_order_points_and_coupon",
    { p_order_id: order.id },
  );

  if (!result.success) {
    if (result.error === "insufficient_balance") {
      throw new Error(
        `Хэрэглэгчийн оноо хүрэлцэхгүй (одоогийн: ${result.current_balance}, шаардлагатай: ${result.required}).`,
      );
    }
    throw new Error(result.error ?? "Буцаалт хийхэд алдаа гарлаа.");
  }
}

async function recordOrderPointsAndCoupon(order: OrderDetails) {
  // Single-transaction RPC. Replaces the previous chain of separate
  // inserts + read-modify-write on coupons.usage_count. The RPC is
  // idempotent: each insert is gated by an existence check so
  // duplicate calls are a no-op.
  const orderTotal = order.total_amount + order.points_used;
  const pointsEarned = Math.floor(orderTotal * 0.02);

  await adminApi.rpc<{ success: boolean; error?: string }>(
    "record_order_points_and_coupon",
    {
      p_order_id: order.id,
      p_points_used: order.points_used,
      p_points_earned: pointsEarned,
      p_coupon_id:
        order.coupon_id && order.coupon_discount > 0 ? order.coupon_id : null,
      p_coupon_discount: order.coupon_discount ?? 0,
    },
  );
}

export function useOrderEdit(id: string) {
  const queryClient = useQueryClient();

  const [isSavingDeliveryStatus, setIsSavingDeliveryStatus] = useState(false);
  const [isSavingPaymentStatus, setIsSavingPaymentStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] =
    useState<DeliveryStatus>("pending");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("unpaid");
  const [allocatingItemId, setAllocatingItemId] = useState<string | null>(null);

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
      adminApi.getAll<{ type: string; amount: number }>(
        "point_transactions",
        {
          select: "type, amount",
          filters: { "order_id.eq": id },
        },
      ),
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

  useEffect(() => {
    if (order) {
      setDeliveryStatus(order.delivery_status);
      setPaymentStatus(order.payment_status);
    }
  }, [order]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      adminApi.update("orders", id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(id) });
    },
  });

  const handleSaveDeliveryStatus = async () => {
    setIsSavingDeliveryStatus(true);
    setError(null);

    try {
      await saveMutation.mutateAsync({
        delivery_status: deliveryStatus,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      setError(translateServerError(err instanceof Error ? err.message : "", "Хүргэлтийн төлөв хадгалахад алдаа гарлаа."));
    } finally {
      setIsSavingDeliveryStatus(false);
    }
  };

  const handleSavePaymentStatus = async () => {
    setIsSavingPaymentStatus(true);
    setError(null);

    try {
      const updateData: Record<string, unknown> = {
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      };

      if (paymentStatus === "paid") {
        updateData.status = "confirmed";
        updateData.paid_at = new Date().toISOString();
      } else if (order?.payment_status === "paid" && order?.payment_method !== "transfer") {
        // Changing away from "paid" — clear paid_at (unless transfer, where paid_at = created_at)
        updateData.paid_at = null;
      }

      // Update order status FIRST to ensure it's always saved
      await saveMutation.mutateAsync(updateData);

      // Then handle stock, points/coupon (non-blocking for the status update)
      try {
        if (paymentStatus === "failed" && order?.payment_status === "paid") {
          // Restore stock if it was previously decremented
          const currentOrder = await adminApi.getById<{ stock_decremented: boolean }>(
            "orders", id, { select: "stock_decremented" },
          );
          if (currentOrder?.stock_decremented) {
            await adminApi.rpc("restore_order_stock", { p_order_id: order.id });
            await adminApi.update("orders", id, { stock_decremented: false });
          }
          await refundOrderPointsAndCoupon(order);
        }

        if (paymentStatus === "paid" && order?.payment_status !== "paid") {
          // Decrement stock if not already done
          const currentOrder = await adminApi.getById<{ stock_decremented: boolean }>(
            "orders", id, { select: "stock_decremented" },
          );
          if (!currentOrder?.stock_decremented) {
            await adminApi.rpc("decrement_order_stock", { p_order_id: order!.id });
            await adminApi.update("orders", id, { stock_decremented: true });
          }
          await recordOrderPointsAndCoupon(order!);
        }
      } catch (pointsErr) {
        log.error("order_stock_points_coupon_error", pointsErr);
        setError(
          `Төлөв хадгалагдсан. Нөөц/оноо/купон бүртгэлд алдаа: ${translateServerError(pointsErr instanceof Error ? pointsErr.message : "")}`,
        );
      }
    } catch (err) {
      setError(translateServerError(err instanceof Error ? err.message : "", "Төлбөрийн төлөв хадгалахад алдаа гарлаа."));
    } finally {
      setIsSavingPaymentStatus(false);
    }
  };

  const allocateItemMutation = useMutation({
    mutationFn: async ({
      itemId,
      warehouseId,
      isReturned,
    }: {
      itemId: string;
      warehouseId: string | null;
      isReturned: boolean;
    }) => {
      // Update the order item
      await adminApi.update("order_items", itemId, {
        warehouse_id: warehouseId,
        is_returned: isReturned,
      });

      // After save, check all items' allocation state and auto-update delivery status
      if (order) {
        const updatedItems = order.order_items.map((item) =>
          item.id === itemId
            ? { ...item, warehouse_id: warehouseId, is_returned: isReturned }
            : item,
        );

        const allAllocated = updatedItems.every(
          (item) => item.warehouse_id || item.is_returned,
        );
        const someAllocated = updatedItems.some(
          (item) => item.warehouse_id || item.is_returned,
        );

        // Only auto-update if current status is pending or preparing
        if (
          order.delivery_status === "pending" ||
          order.delivery_status === "preparing"
        ) {
          if (allAllocated) {
            await adminApi.update("orders", id, {
              delivery_status: "confirmed",
              updated_at: new Date().toISOString(),
            });
          } else if (someAllocated && order.delivery_status === "pending") {
            await adminApi.update("orders", id, {
              delivery_status: "preparing",
              updated_at: new Date().toISOString(),
            });
          }
        }
      }
    },
    onMutate: async ({ itemId }) => {
      setAllocatingItemId(itemId);
    },
    onSuccess: (_data, { itemId, warehouseId, isReturned }) => {
      // Optimistically update the cached order to preserve item order
      queryClient.setQueryData(
        queryKeys.orders.detail(id),
        (old: OrderDetails | undefined) => {
          if (!old) return old;

          const updatedItems = old.order_items.map((item) =>
            item.id === itemId
              ? { ...item, warehouse_id: warehouseId, is_returned: isReturned }
              : item,
          );

          // Compute delivery_status to match mutationFn logic
          let newDeliveryStatus = old.delivery_status;
          if (
            old.delivery_status === "pending" ||
            old.delivery_status === "preparing"
          ) {
            const allAllocated = updatedItems.every(
              (item) => item.warehouse_id || item.is_returned,
            );
            const someAllocated = updatedItems.some(
              (item) => item.warehouse_id || item.is_returned,
            );
            if (allAllocated) {
              newDeliveryStatus = "confirmed";
            } else if (someAllocated && old.delivery_status === "pending") {
              newDeliveryStatus = "preparing";
            }
          }

          return {
            ...old,
            delivery_status: newDeliveryStatus,
            order_items: updatedItems,
          };
        },
      );
      // Only invalidate list queries, not the detail (which relies on optimistic update)
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.orders.all, "list"],
      });
    },
    onSettled: () => {
      setAllocatingItemId(null);
    },
  });

  const handleAllocateItem = (
    itemId: string,
    warehouseId: string | null,
    isReturned: boolean,
  ) => {
    allocateItemMutation.mutate({ itemId, warehouseId, isReturned });
  };

  const hasDeliveryStatusChanges =
    order && deliveryStatus !== order.delivery_status;
  const hasPaymentStatusChanges =
    order && paymentStatus !== order.payment_status;

  return {
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
  };
}
