"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { adminApi } from "@/lib/admin-api";
import { queryKeys } from "@/lib/query-keys";

import type { OrderDetails } from "@/components/order/types";
import type { DeliveryStatus } from "@/types/database";

type AllocationItem = {
  id: string;
  warehouse_id: string | null;
  is_returned: boolean;
};

interface AllocationStateInput {
  items: AllocationItem[];
  currentStatus: DeliveryStatus;
}

/**
 * Given the post-update list of items and the order's current delivery
 * status, returns the next delivery status. Only auto-advances when the
 * status is `pending` or `preparing`; otherwise returns the current status
 * unchanged.
 */
function deriveNextDeliveryStatus(input: AllocationStateInput): DeliveryStatus {
  const { items, currentStatus } = input;
  if (currentStatus !== "pending" && currentStatus !== "preparing") {
    return currentStatus;
  }
  const allAllocated = items.every((item) => item.warehouse_id || item.is_returned);
  const someAllocated = items.some((item) => item.warehouse_id || item.is_returned);
  if (allAllocated) return "confirmed";
  if (someAllocated && currentStatus === "pending") return "preparing";
  return currentStatus;
}

interface AllocationParams {
  itemId: string;
  warehouseId: string | null;
  isReturned: boolean;
}

export function useOrderEditAllocation(id: string, order: OrderDetails | null) {
  const queryClient = useQueryClient();
  const [allocatingItemId, setAllocatingItemId] = useState<string | null>(null);

  const allocateItemMutation = useMutation({
    mutationFn: async ({ itemId, warehouseId, isReturned }: AllocationParams) => {
      // Update the order item
      await adminApi.update("order_items", itemId, {
        warehouse_id: warehouseId,
        is_returned: isReturned,
      });

      if (!order) return;

      // After save, check all items' allocation state and auto-update delivery status
      const updatedItems = order.order_items.map((item) =>
        item.id === itemId ? { ...item, warehouse_id: warehouseId, is_returned: isReturned } : item,
      );
      const nextStatus = deriveNextDeliveryStatus({
        items: updatedItems,
        currentStatus: order.delivery_status,
      });
      if (nextStatus !== order.delivery_status) {
        await adminApi.update("orders", id, {
          delivery_status: nextStatus,
          updated_at: new Date().toISOString(),
        });
      }
    },
    onMutate: async ({ itemId }) => {
      setAllocatingItemId(itemId);
    },
    onSuccess: (_data, { itemId, warehouseId, isReturned }) => {
      // Optimistically update the cached order to preserve item order
      queryClient.setQueryData(queryKeys.orders.detail(id), (old: OrderDetails | undefined) => {
        if (!old) return old;

        const updatedItems = old.order_items.map((item) =>
          item.id === itemId
            ? { ...item, warehouse_id: warehouseId, is_returned: isReturned }
            : item,
        );
        const newDeliveryStatus = deriveNextDeliveryStatus({
          items: updatedItems,
          currentStatus: old.delivery_status,
        });

        return {
          ...old,
          delivery_status: newDeliveryStatus,
          order_items: updatedItems,
        };
      });
      // Only invalidate list queries, not the detail (which relies on optimistic update)
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.orders.all, "list"],
      });
    },
    onSettled: () => {
      setAllocatingItemId(null);
    },
  });

  const handleAllocateItem = (itemId: string, warehouseId: string | null, isReturned: boolean) => {
    allocateItemMutation.mutate({ itemId, warehouseId, isReturned });
  };

  return { allocatingItemId, handleAllocateItem };
}
