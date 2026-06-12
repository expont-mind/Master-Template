"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { adminApi } from "@/lib/admin-api";
import { log } from "@/lib/observability/log";
import { queryKeys } from "@/lib/query-keys";
import { translateServerError } from "@/lib/utils/error-messages";

import type { OrderDetails } from "@/components/order/types";
import type { DeliveryStatus, PaymentStatus } from "@/types/database";

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
  const result = await adminApi.rpc<RefundResult>("refund_order_points_and_coupon", {
    p_order_id: order.id,
  });

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

  await adminApi.rpc<{ success: boolean; error?: string }>("record_order_points_and_coupon", {
    p_order_id: order.id,
    p_points_used: order.points_used,
    p_points_earned: pointsEarned,
    p_coupon_id: order.coupon_id && order.coupon_discount > 0 ? order.coupon_id : null,
    p_coupon_discount: order.coupon_discount ?? 0,
  });
}

function buildPaymentUpdateData(
  newStatus: PaymentStatus,
  order: OrderDetails | null,
): Record<string, unknown> {
  const updateData: Record<string, unknown> = {
    payment_status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === "paid") {
    updateData.status = "confirmed";
    updateData.paid_at = new Date().toISOString();
  } else if (order?.payment_status === "paid" && order?.payment_method !== "transfer") {
    // Changing away from "paid" — clear paid_at (unless transfer, where paid_at = created_at)
    updateData.paid_at = null;
  }

  return updateData;
}

async function handleStockRestoreOnFail(orderId: string, order: OrderDetails): Promise<void> {
  const currentOrder = await adminApi.getById<{ stock_decremented: boolean }>("orders", orderId, {
    select: "stock_decremented",
  });
  if (currentOrder?.stock_decremented) {
    await adminApi.rpc("restore_order_stock", { p_order_id: order.id });
    await adminApi.update("orders", orderId, { stock_decremented: false });
  }
  await refundOrderPointsAndCoupon(order);
}

async function handleStockDecrementOnPay(orderId: string, order: OrderDetails): Promise<void> {
  const currentOrder = await adminApi.getById<{ stock_decremented: boolean }>("orders", orderId, {
    select: "stock_decremented",
  });
  if (!currentOrder?.stock_decremented) {
    await adminApi.rpc("decrement_order_stock", { p_order_id: order.id });
    await adminApi.update("orders", orderId, { stock_decremented: true });
  }
  await recordOrderPointsAndCoupon(order);
}

async function applyPaymentSideEffects(
  orderId: string,
  newStatus: PaymentStatus,
  order: OrderDetails | undefined | null,
): Promise<void> {
  if (!order) return;
  if (newStatus === "failed" && order.payment_status === "paid") {
    await handleStockRestoreOnFail(orderId, order);
  }
  if (newStatus === "paid" && order.payment_status !== "paid") {
    await handleStockDecrementOnPay(orderId, order);
  }
}

export function useOrderEditStatus(id: string, order: OrderDetails | null) {
  const queryClient = useQueryClient();
  const [isSavingDeliveryStatus, setIsSavingDeliveryStatus] = useState(false);
  const [isSavingPaymentStatus, setIsSavingPaymentStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>("pending");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("unpaid");

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.update("orders", id, data),
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
      setError(
        translateServerError(
          err instanceof Error ? err.message : "",
          "Хүргэлтийн төлөв хадгалахад алдаа гарлаа.",
        ),
      );
    } finally {
      setIsSavingDeliveryStatus(false);
    }
  };

  const handleSavePaymentStatus = async () => {
    setIsSavingPaymentStatus(true);
    setError(null);

    try {
      const updateData = buildPaymentUpdateData(paymentStatus, order);
      // Update order status FIRST to ensure it's always saved
      await saveMutation.mutateAsync(updateData);

      // Then handle stock, points/coupon (non-blocking for the status update)
      try {
        await applyPaymentSideEffects(id, paymentStatus, order);
      } catch (pointsErr) {
        log.error("order_stock_points_coupon_error", pointsErr);
        setError(
          `Төлөв хадгалагдсан. Нөөц/оноо/купон бүртгэлд алдаа: ${translateServerError(pointsErr instanceof Error ? pointsErr.message : "")}`,
        );
      }
    } catch (err) {
      setError(
        translateServerError(
          err instanceof Error ? err.message : "",
          "Төлбөрийн төлөв хадгалахад алдаа гарлаа.",
        ),
      );
    } finally {
      setIsSavingPaymentStatus(false);
    }
  };

  return {
    deliveryStatus,
    paymentStatus,
    setDeliveryStatus,
    setPaymentStatus,
    isSavingDeliveryStatus,
    isSavingPaymentStatus,
    error,
    setError,
    handleSaveDeliveryStatus,
    handleSavePaymentStatus,
  };
}
