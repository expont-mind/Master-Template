import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { log } from "../_shared/log.ts";

const LENDMN_API_URL = Deno.env.get("LENDMN_API_URL")!;
const LENDMN_CLIENT_ID = Deno.env.get("LENDMN_CLIENT_ID")!;
const LENDMN_CLIENT_SECRET = Deno.env.get("LENDMN_CLIENT_SECRET")!;

// Module-level token cache
let accessToken: string | null = null;
let tokenExpiresAt = 0;

const okResponse = () =>
  new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  // Try JSON first, fallback to form-encoded
  let res = await fetch(`${LENDMN_API_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: LENDMN_CLIENT_ID,
      client_secret: LENDMN_CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    res = await fetch(`${LENDMN_API_URL}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: LENDMN_CLIENT_ID,
        client_secret: LENDMN_CLIENT_SECRET,
      }),
    });

    if (!res.ok) {
      throw new Error(`LendMN auth failed: ${res.status}`);
    }
  }

  const data = await res.json();
  accessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000;
  return accessToken!;
}

async function verifyInvoiceWithLendMN(
  invoiceNumber: string,
): Promise<{ paid: boolean; amount?: number; transactionId?: string; wallet?: string }> {
  const token = await getAccessToken();

  const res = await fetch(`${LENDMN_API_URL}/api/payments/invoices/${invoiceNumber}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`LendMN verify failed: ${res.status}`);
  }

  const data = await res.json();

  // LendMN may use numeric status codes or string statuses
  // Check common patterns: status === "paid", status === 1, status === "PAID"
  const status = data.status ?? data.invoiceStatus ?? data.invoice_status;
  const isPaid =
    status === "paid" ||
    status === "PAID" ||
    status === 1 ||
    status === "1" ||
    status === "COMPLETED" ||
    status === "completed";

  return {
    paid: isPaid,
    amount: data.amount ?? data.paidAmount ?? data.paid_amount,
    transactionId: data.transactionId ?? data.transaction_id ?? data.id,
    wallet: data.wallet ?? data.phoneNumber ?? data.phone_number,
  };
}

Deno.serve(async (req) => {
  // Always return 200 to prevent webhook retries
  if (req.method !== "POST") {
    return okResponse();
  }

  try {
    const body = await req.json();

    // Extract invoiceNumber from callback body (flexible parsing)
    const invoiceNumber =
      body.invoiceNumber ?? body.invoice_number ?? body.InvoiceNumber ?? body.data?.invoiceNumber;

    if (!invoiceNumber) {
      return okResponse();
    }

    // Verify payment status directly with LendMN API
    const result = await verifyInvoiceWithLendMN(invoiceNumber);

    if (!result.paid) {
      return okResponse();
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find invoice by external_invoice_number + provider
    const { data: invoice, error: findError } = await supabase
      .from("payment_invoices")
      .select("id, status")
      .eq("external_invoice_number", invoiceNumber)
      .eq("provider", "lendmn")
      .single();

    if (findError || !invoice) {
      return okResponse();
    }

    if (invoice.status === "paid") {
      return okResponse();
    }

    // Update invoice status
    await supabase
      .from("payment_invoices")
      .update({
        status: "paid",
        paid_amount: result.amount ?? null,
        transaction_id: result.transactionId ?? null,
        payment_wallet: result.wallet ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);

    // Create order server-side (idempotent)
    await supabase.rpc("create_order_from_invoice", {
      p_invoice_id: invoice.id,
    });

    return okResponse();
  } catch (err) {
    log.error("[lendmn-callback] Error:", err);
    // Always return 200 to prevent retries
    return okResponse();
  }
});
