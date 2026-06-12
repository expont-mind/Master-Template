import { createClient } from "@supabase/supabase-js";

type LogStatus = "info" | "error" | "success";

interface PaymentLogParams {
  invoiceId?: string | null;
  orderId?: string | null;
  provider?: string | null;
  event: string;
  status?: LogStatus;
  message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log a payment event to the payment_logs table.
 * Uses service_role client — works in callbacks (no user session).
 * Fire-and-forget: never throws, never blocks the payment flow.
 */
export async function logPaymentEvent(params: PaymentLogParams): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    await supabase.from("payment_logs").insert({
      invoice_id: params.invoiceId ?? null,
      order_id: params.orderId ?? null,
      provider: params.provider ?? null,
      event: params.event,
      status: params.status ?? "error",
      message: params.message ?? null,
      metadata: params.metadata ?? {},
    });
  } catch {
    // Never block payment flow for logging failure
  }
}
