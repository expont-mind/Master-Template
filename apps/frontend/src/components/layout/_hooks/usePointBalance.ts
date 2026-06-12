"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function usePointBalance(userId: string | undefined) {
  const [pointBalance, setPointBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) {
      // Reset when user signs out.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPointBalance(null);
      return;
    }
    const supabase = createClient();
    supabase
      .from("point_transactions")
      .select("amount")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (data) {
          setPointBalance(data.reduce((sum, t) => sum + t.amount, 0));
        }
      });
  }, [userId]);

  return pointBalance;
}
