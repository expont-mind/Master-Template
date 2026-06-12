import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { log } from "../_shared/log.ts";

const QUICKPAY_API_URL = Deno.env.get("QUICKPAY_API_URL")!;
const QUICKPAY_API_KEY = Deno.env.get("QUICKPAY_API_KEY")!;
const QUICKPAY_MERCHANT_ID = Deno.env.get("QUICKPAY_MERCHANT_ID")!;

async function verifyPaymentWithQPay(invoiceId: string) {
  const res = await fetch(`${QUICKPAY_API_URL}/api/qpay/payments/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${QUICKPAY_API_KEY}`,
      "X-QPay-Merchant-Id": QUICKPAY_MERCHANT_ID,
    },
    body: JSON.stringify({ invoice_id: invoiceId }),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(`QPay check failed: ${res.status}`);
  }

  return json.data as {
    id: string;
    invoice_status: string;
    invoice_status_date: string;
    payments: {
      id: string;
      amount: string;
      paid_by: string;
      payment_status: string;
      transactions: {
        id: string;
        amount: string;
        status: string;
      }[];
    }[];
  };
}

Deno.serve(async (req) => {
  // QPay sends POST callback
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const invoiceId = body.invoice_id;

    if (!invoiceId) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify payment with QPay
    const result = await verifyPaymentWithQPay(invoiceId);

    const isPaid = result.invoice_status === "PAID";
    const payment = result.payments?.[0];
    const paidAmount = payment ? parseFloat(payment.amount) : 0;

    if (isPaid && paidAmount > 0) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      await supabase
        .from("payment_invoices")
        .update({
          status: "paid",
          paid_amount: paidAmount,
          transaction_id: payment?.transactions?.[0]?.id ?? null,
          payment_wallet: payment?.paid_by ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      // Create order server-side (idempotent — safe to call multiple times)
      const { data: rpcResult, error: rpcError } = await supabase.rpc("create_order_from_invoice", {
        p_invoice_id: invoiceId,
      });

      if (rpcError) {
        log.error("[qpay-callback] RPC error:", rpcError);
        return new Response(JSON.stringify({ success: false, error: rpcError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result2 = rpcResult as { success: boolean; error?: string } | null;
      if (result2 && !result2.success) {
        log.error("[qpay-callback] RPC returned failure:", result2.error);
        return new Response(JSON.stringify({ success: false, error: result2.error }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    log.error("[qpay-callback] Unhandled error:", err);
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
