"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * Subscribe to realtime UPDATE events on the `orders` row and invoke
 * `onPaid()` when the row transitions to `payment_status === "paid"`.
 * Used by usePaymentPolling so an admin marking the order paid manually
 * triggers the same confirmation flow as the polling path.
 */
export function useOrderPaymentRealtime(orderId: string | null, paid: boolean, onPaid: () => void) {
  useEffect(() => {
    if (!orderId || paid) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`order-payment-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const newPaymentStatus = (payload.new as { payment_status?: string })?.payment_status;
          if (newPaymentStatus === "paid") {
            onPaid();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, paid, onPaid]);
}
