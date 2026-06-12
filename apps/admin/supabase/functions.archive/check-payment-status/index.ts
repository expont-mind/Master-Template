import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { log } from "../_shared/log.ts";

/**
 * Check payment status for an invoice.
 * Matches web's checkPaymentStatus() in actions.ts.
 *
 * 1. Check payment_invoices table first (updated by callbacks)
 * 2. Fallback: call provider API (QPay or LendMN)
 * 3. If paid via provider, update DB for future instant checks
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const QUICKPAY_API_URL = Deno.env.get("QUICKPAY_API_URL")!;
const QUICKPAY_API_KEY = Deno.env.get("QUICKPAY_API_KEY")!;
const QUICKPAY_MERCHANT_ID = Deno.env.get("QUICKPAY_MERCHANT_ID")!;

const LENDMN_API_URL = Deno.env.get("LENDMN_API_URL")!;
const LENDMN_CLIENT_ID = Deno.env.get("LENDMN_CLIENT_ID")!;
const LENDMN_CLIENT_SECRET = Deno.env.get("LENDMN_CLIENT_SECRET")!;

const STOREPAY_API_URL = Deno.env.get("STOREPAY_API_URL")!;
const STOREPAY_AUTH_URL = Deno.env.get("STOREPAY_AUTH_URL")!;
const STOREPAY_USERNAME = Deno.env.get("STOREPAY_USERNAME")!;
const STOREPAY_PASSWORD = Deno.env.get("STOREPAY_PASSWORD")!;
const STOREPAY_APP_USERNAME = Deno.env.get("STOREPAY_APP_USERNAME")!;
const STOREPAY_APP_PASSWORD = Deno.env.get("STOREPAY_APP_PASSWORD")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── QPay check ──────────────────────────────────────────────────

async function checkQPayPayment(invoiceId: string) {
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
    invoice_status: string;
    payments: {
      id: string;
      amount: string;
      paid_by: string;
      transactions: { id: string }[];
    }[];
  };
}

// ─── LendMN check ────────────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getLendMNToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const res = await fetch(`${LENDMN_API_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: LENDMN_CLIENT_ID,
      client_secret: LENDMN_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });

  const json = await res.json();
  const token = json.access_token;
  if (!token) throw new Error("Failed to get LendMN token");

  cachedToken = {
    token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 - 60_000,
  };
  return token;
}

async function checkLendMNPayment(invoiceNumber: string) {
  const token = await getLendMNToken();

  const res = await fetch(`${LENDMN_API_URL}/api/payments/invoices/${invoiceNumber}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`LendMN check failed: ${res.status}`);
  }

  const status = (json.status || json.invoiceStatus || json.invoice_status || "")
    .toString()
    .toLowerCase();

  const paid = ["paid", "completed", "1"].includes(status);
  const amount = json.amount ? Number(json.amount) : null;

  return { paid, amount };
}

// ─── StorePay check ──────────────────────────────────────────────

let storepayToken: { token: string; expiresAt: number } | null = null;

async function getStorePayToken(): Promise<string> {
  if (storepayToken && Date.now() < storepayToken.expiresAt) {
    return storepayToken.token;
  }

  const basicAuth = btoa(`${STOREPAY_APP_USERNAME}:${STOREPAY_APP_PASSWORD}`);
  const authUrl = `${STOREPAY_AUTH_URL}?grant_type=password&username=${encodeURIComponent(STOREPAY_USERNAME)}&password=${encodeURIComponent(STOREPAY_PASSWORD)}`;

  const res = await fetch(authUrl, {
    method: "POST",
    headers: { Authorization: `Basic ${basicAuth}` },
  });

  if (!res.ok) {
    throw new Error(`StorePay auth failed: ${res.status}`);
  }

  const data = await res.json();
  const token = data.access_token;
  if (!token) throw new Error("StorePay auth: no access_token");

  storepayToken = {
    token,
    expiresAt: Date.now() + (data.expires_in ?? 7200) * 1000 - 60_000,
  };
  return token;
}

async function checkStorePayPayment(loanId: string) {
  const token = await getStorePayToken();

  const res = await fetch(`${STOREPAY_API_URL}/merchant/loan/check/${loanId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`StorePay check failed: ${res.status}`);
  }

  const isPaid =
    json.status === "Success" && json.value === true && json.data?.isConfirmed === true;

  const amount = json.data?.amount ? parseFloat(json.data.amount) : null;

  return { paid: isPaid, amount };
}

// ─── Main handler ────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { invoiceId, provider = "qpay" } = (await req.json()) as {
      invoiceId: string;
      provider?: "qpay" | "lendmn" | "storepay";
    };

    if (!invoiceId) {
      return new Response(JSON.stringify({ success: false, error: "invoiceId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1. Check DB first (updated by callbacks)
    const { data: invoice } = await admin
      .from("payment_invoices")
      .select("status, external_invoice_number")
      .eq("id", invoiceId)
      .single();

    if (invoice?.status === "paid") {
      return new Response(JSON.stringify({ success: true, paid: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Provider fallback
    if (provider === "lendmn") {
      const extNum = invoice?.external_invoice_number;
      if (!extNum) {
        return new Response(JSON.stringify({ success: true, paid: false }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await checkLendMNPayment(extNum);
      if (result.paid) {
        await admin
          .from("payment_invoices")
          .update({
            status: "paid",
            paid_amount: result.amount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoiceId);

        // Update order status via idempotent RPC
        await admin.rpc("create_order_from_invoice", { p_invoice_id: invoiceId });

        return new Response(JSON.stringify({ success: true, paid: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, paid: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // StorePay fallback
    if (provider === "storepay") {
      const extNum = invoice?.external_invoice_number;
      if (!extNum) {
        return new Response(JSON.stringify({ success: true, paid: false }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await checkStorePayPayment(extNum);
      if (result.paid) {
        await admin
          .from("payment_invoices")
          .update({
            status: "paid",
            paid_amount: result.amount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoiceId);

        await admin.rpc("create_order_from_invoice", { p_invoice_id: invoiceId });

        return new Response(JSON.stringify({ success: true, paid: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, paid: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // QPay fallback
    const result = await checkQPayPayment(invoiceId);
    const isPaid = result.invoice_status === "PAID";
    const payment = result.payments?.[0];
    const paidAmount = payment ? parseFloat(payment.amount) : 0;

    if (isPaid && paidAmount > 0) {
      await admin
        .from("payment_invoices")
        .update({
          status: "paid",
          paid_amount: paidAmount,
          transaction_id: payment?.transactions?.[0]?.id ?? null,
          payment_wallet: payment?.paid_by ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      // Update order status via idempotent RPC
      await admin.rpc("create_order_from_invoice", { p_invoice_id: invoiceId });

      return new Response(JSON.stringify({ success: true, paid: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, paid: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    log.error("[check-payment-status] Error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Алдаа гарлаа",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
