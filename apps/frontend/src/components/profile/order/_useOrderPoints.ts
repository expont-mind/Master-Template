"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

interface UseOrderPointsResult {
  pointsUsed: number;
  pointsEarned: number;
}

/**
 * Fetch point transactions for an order. Returns the breakdown of points
 * used (negative tx → absolute) and points earned.
 */
export function useOrderPoints(orderId: string): UseOrderPointsResult {
  const [pointsUsed, setPointsUsed] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);

  useEffect(() => {
    const fetchPoints = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("point_transactions")
        .select("type, amount")
        .eq("order_id", orderId);
      if (!data) return;
      for (const tx of data) {
        if (tx.type === "used") setPointsUsed(Math.abs(tx.amount));
        if (tx.type === "earned") setPointsEarned(tx.amount);
      }
    };
    fetchPoints();
  }, [orderId]);

  return { pointsUsed, pointsEarned };
}
