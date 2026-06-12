"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

import { notificationKeys } from "./_notificationKeys";

import type { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeOptions {
  onPointGift?: (amount: number, description: string) => void;
}

function maybeTriggerPointGift(payload: unknown, options: RealtimeOptions | undefined) {
  if (!options?.onPointGift) return;
  const row = (
    payload as {
      new?: {
        type?: string;
        metadata?: {
          sub_type?: string;
          amount?: number;
          description?: string;
        } | null;
      };
    }
  ).new;
  if (!row) return;
  if (
    row.type === "promotion" &&
    row.metadata?.sub_type === "admin_gift" &&
    row.metadata.amount &&
    row.metadata.description !== "Шинэ хэрэглэгчийн бонус"
  ) {
    options.onPointGift(row.metadata.amount, row.metadata.description || "");
  }
}

// Real-time subscription hook for notifications
export function useRealtimeNotifications(userId: string | undefined, options?: RealtimeOptions) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const invalidateNotifications = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  }, [queryClient]);

  useEffect(() => {
    if (!userId) return;

    let notificationsChannel: RealtimeChannel | null = null;
    let statusHistoryChannel: RealtimeChannel | null = null;

    const setupSubscriptions = async () => {
      // Subscribe to notifications table changes for this user
      notificationsChannel = supabase
        .channel(`notifications_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            invalidateNotifications();
            maybeTriggerPointGift(payload, options);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            invalidateNotifications();
          },
        )
        .subscribe();

      // Get user's order IDs for status history subscription
      const { data: orders } = await supabase.from("orders").select("id").eq("user_id", userId);

      if (orders && orders.length > 0) {
        const orderIds = orders.map((o) => o.id);
        const matches = (payload: unknown) =>
          orderIds.includes((payload as { new: { order_id: string } }).new.order_id);

        statusHistoryChannel = supabase
          .channel(`order_status_${userId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "order_status_history",
            },
            (payload) => {
              if (matches(payload)) invalidateNotifications();
            },
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "order_status_history",
            },
            (payload) => {
              if (matches(payload)) invalidateNotifications();
            },
          )
          .subscribe();
      }
    };

    setupSubscriptions();

    return () => {
      if (notificationsChannel) {
        supabase.removeChannel(notificationsChannel);
      }
      if (statusHistoryChannel) {
        supabase.removeChannel(statusHistoryChannel);
      }
    };
    // `options` deliberately excluded: it's a callbacks-only object and adding
    // it would re-subscribe to Postgres channels whenever the caller re-renders.
    // Subscription needs to outlive prop identity churn for stable connections.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, supabase, invalidateNotifications]);
}
