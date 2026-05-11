import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getLendMNInvoiceStatus } from "@/lib/lendmn/client";
import { logPaymentEvent } from "@/lib/payment-logger";
import type { Database } from "@/types/database";
import {
  callerIp,
  isJsonRequest,
  rateLimit,
  safeJson,
} from "@/lib/api/callback-guards";

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const ok = () => NextResponse.json({ success: true });

interface LendMnBody {
  invoiceNumber?: string | null;
  invoice_number?: string | null;
  InvoiceNumber?: string | null;
  data?: { invoiceNumber?: string | null } | null;
}

export async function POST(req: NextRequest) {
  try {
    if (!isJsonRequest(req)) {
      return NextResponse.json(
        { success: false, error: "expected application/json" },
        { status: 400 },
      );
    }

    const limit = await rateLimit(`rl:callback:lendmn:${callerIp(req)}`);
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, error: "rate limited" },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        },
      );
    }

    const body = await safeJson<LendMnBody>(req);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "invalid json" },
        { status: 400 },
      );
    }

    const invoiceNumber =
      body.invoiceNumber ??
      body.invoice_number ??
      body.InvoiceNumber ??
      body.data?.invoiceNumber;

    if (!invoiceNumber || typeof invoiceNumber !== "string") {
      return ok();
    }

    await logPaymentEvent({
      provider: "lendmn",
      event: "callback_received",
      status: "info",
      metadata: { invoiceNumber },
    });

    // Verify payment status directly with LendMN API
    const result = await getLendMNInvoiceStatus(invoiceNumber);

    if (!result.paid) {
      return ok();
    }

    const supabase = getAdminClient();

    // Find invoice by external_invoice_number + provider
    const { data: invoice, error: findError } = await supabase
      .from("payment_invoices")
      .select("id, status, order_id")
      .eq("external_invoice_number", invoiceNumber)
      .eq("provider", "lendmn")
      .single();

    if (findError || !invoice) {
      console.error("[lendmn-callback] Invoice not found:", { invoiceNumber, findError });
      await logPaymentEvent({
        provider: "lendmn",
        event: "invoice_not_found",
        message: findError?.message ?? "No matching invoice",
        metadata: { invoiceNumber },
      });
      return NextResponse.json({ success: false }, { status: 500 });
    }

    if (invoice.status === "paid") {
      // Invoice already paid — but check if order was actually confirmed
      if (invoice.order_id) {
        const { data: order } = await supabase
          .from("orders")
          .select("status, payment_status")
          .eq("id", invoice.order_id)
          .single();

        if (order?.status === "confirmed" && order?.payment_status === "paid") {
          return ok(); // Fully processed
        }
      }

      // Invoice paid but order not confirmed — retry RPC
      await logPaymentEvent({
        invoiceId: invoice.id,
        orderId: invoice.order_id,
        provider: "lendmn",
        event: "rpc_retry",
        status: "info",
        message: "Invoice paid but order not confirmed, retrying RPC",
      });

      const { data: rpcData, error: rpcError } = await supabase.rpc("create_order_from_invoice", {
        p_invoice_id: invoice.id,
      });

      if (rpcError) {
        console.error("[lendmn-callback] RPC retry error:", rpcError, { invoiceNumber });
        await logPaymentEvent({
          invoiceId: invoice.id,
          orderId: invoice.order_id,
          provider: "lendmn",
          event: "rpc_retry_error",
          message: rpcError.message,
        });
        return NextResponse.json({ success: false }, { status: 500 });
      }

      const rpcResult = rpcData as { success: boolean; error?: string } | null;
      if (rpcResult && !rpcResult.success) {
        console.error("[lendmn-callback] RPC retry failure:", rpcResult.error, { invoiceNumber });
        await logPaymentEvent({
          invoiceId: invoice.id,
          orderId: invoice.order_id,
          provider: "lendmn",
          event: "rpc_retry_failure",
          message: rpcResult.error,
        });
        return NextResponse.json({ success: false }, { status: 500 });
      }

      await logPaymentEvent({
        invoiceId: invoice.id,
        orderId: invoice.order_id,
        provider: "lendmn",
        event: "order_confirmed_on_retry",
        status: "success",
      });

      return ok();
    }

    // Update invoice status
    const { error: updateError } = await supabase
      .from("payment_invoices")
      .update({
        status: "paid",
        paid_amount: result.amount ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);

    if (updateError) {
      console.error("[lendmn-callback] Invoice update error:", updateError, { invoiceNumber });
      await logPaymentEvent({
        invoiceId: invoice.id,
        provider: "lendmn",
        event: "invoice_update_failed",
        message: updateError.message,
      });
      return NextResponse.json({ success: false }, { status: 500 });
    }

    // Create order server-side (idempotent)
    const { data: rpcData2, error: rpcError } = await supabase.rpc("create_order_from_invoice", {
      p_invoice_id: invoice.id,
    });

    if (rpcError) {
      console.error("[lendmn-callback] RPC error:", rpcError, { invoiceNumber });
      await logPaymentEvent({
        invoiceId: invoice.id,
        orderId: invoice.order_id,
        provider: "lendmn",
        event: "rpc_error",
        message: rpcError.message,
      });
      return NextResponse.json({ success: false }, { status: 500 });
    }

    const rpcResult2 = rpcData2 as { success: boolean; error?: string } | null;
    if (rpcResult2 && !rpcResult2.success) {
      console.error("[lendmn-callback] RPC failure:", rpcResult2.error, { invoiceNumber });
      await logPaymentEvent({
        invoiceId: invoice.id,
        orderId: invoice.order_id,
        provider: "lendmn",
        event: "rpc_failure",
        message: rpcResult2.error,
      });
      return NextResponse.json({ success: false }, { status: 500 });
    }

    await logPaymentEvent({
      invoiceId: invoice.id,
      orderId: invoice.order_id,
      provider: "lendmn",
      event: "order_confirmed",
      status: "success",
      metadata: { amount: result.amount },
    });

    return ok();
  } catch (err) {
    console.error("[lendmn-callback] Unhandled error:", err);
    await logPaymentEvent({
      provider: "lendmn",
      event: "callback_unhandled_error",
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
