"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { recoverPendingInvoices } from "@/components/checkout/actions";
import { useUIStore } from "@/stores/ui-store";

const SESSION_KEY = "pending-invoices-checked";

async function runRecovery() {
  if (sessionStorage.getItem(SESSION_KEY)) return;
  sessionStorage.setItem(SESSION_KEY, "1");

  try {
    const { recovered } = await recoverPendingInvoices();
    if (recovered > 0) {
      useUIStore.getState().addToast({
        type: "success",
        title: "Захиалга баталгаажлаа",
        message:
          recovered === 1
            ? "Төлбөр амжилттай баталгаажлаа. Захиалга үүслээ."
            : `${recovered} захиалга амжилттай баталгаажлаа.`,
        duration: 6000,
      });
    }
  } catch {
    // Silent — this is a background safety net
  }
}

export function PendingInvoiceRecovery() {
  const ran = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    // Check on mount if already logged in
    if (!ran.current) {
      ran.current = true;
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) runRecovery();
      });
    }

    // Check on sign-in event
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        sessionStorage.removeItem(SESSION_KEY);
        runRecovery();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
