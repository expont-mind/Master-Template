import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { log } from "../_shared/log.ts";

const LENDMN_API_URL = Deno.env.get("LENDMN_API_URL")!;
const LENDMN_CLIENT_ID = Deno.env.get("LENDMN_CLIENT_ID")!;
const LENDMN_CLIENT_SECRET = Deno.env.get("LENDMN_CLIENT_SECRET")!;
const LENDMN_WALLET_ID = Deno.env.get("LENDMN_WALLET_ID")!;

// Module-level token cache (persists across warm invocations)
let accessToken: string | null = null;
let refreshToken: string | null = null;
let tokenExpiresAt = 0;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function fetchNewToken(): Promise<void> {
  const res = await fetch(`${LENDMN_API_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: LENDMN_CLIENT_ID,
      client_secret: LENDMN_CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    // Fallback to form-encoded if JSON fails
    const formRes = await fetch(`${LENDMN_API_URL}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: LENDMN_CLIENT_ID,
        client_secret: LENDMN_CLIENT_SECRET,
      }),
    });

    if (!formRes.ok) {
      throw new Error(`LendMN auth failed: ${formRes.status}`);
    }

    const data = await formRes.json();
    accessToken = data.access_token;
    refreshToken = data.refresh_token ?? null;
    tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000;
    return;
  }

  const data = await res.json();
  accessToken = data.access_token;
  refreshToken = data.refresh_token ?? null;
  tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000;
}

async function refreshAccessToken(): Promise<void> {
  if (!refreshToken) {
    return fetchNewToken();
  }

  try {
    const res = await fetch(`${LENDMN_API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      // Refresh failed, get new token
      return fetchNewToken();
    }

    const data = await res.json();
    accessToken = data.access_token;
    refreshToken = data.refresh_token ?? refreshToken;
    tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000;
  } catch {
    return fetchNewToken();
  }
}

async function getAccessToken(): Promise<string> {
  if (!accessToken || Date.now() >= tokenExpiresAt) {
    if (accessToken && refreshToken) {
      await refreshAccessToken();
    } else {
      await fetchNewToken();
    }
  }
  return accessToken!;
}

async function lendmnFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${LENDMN_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(`LendMN API error ${res.status}: ${JSON.stringify(json)}`);
  }

  return json as T;
}

interface CreateInvoiceBody {
  amount: number;
  description: string;
  phoneNumber: string;
  orderNumber: string;
  userId: string;
  orderId?: string;
  pendingOrderData?: unknown;
}

interface LendMNInvoiceResponse {
  invoiceNumber: string;
  [key: string]: unknown;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "create-invoice": {
        const { amount, description, phoneNumber, orderNumber, userId, pendingOrderData } =
          body as CreateInvoiceBody;

        if (!amount || !phoneNumber || !orderNumber || !userId) {
          return jsonResponse(
            { error: "Missing required fields: amount, phoneNumber, orderNumber, userId" },
            400,
          );
        }

        // Create invoice on LendMN
        const invoice = await lendmnFetch<LendMNInvoiceResponse>("/api/payments/invoices", {
          method: "POST",
          body: JSON.stringify({
            amount,
            description: description || `Monpang захиалга: ${orderNumber}`,
            walletId: LENDMN_WALLET_ID,
            phoneNumber,
          }),
        });

        log.info("[lendmn-debit] LendMN response keys:", Object.keys(invoice));

        // LendMN API may return invoiceNumber or invoice_number
        const invoiceNumber =
          invoice.invoiceNumber ??
          ((invoice as Record<string, unknown>).invoice_number as string) ??
          "";

        // Save to payment_invoices
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        const invoiceId = crypto.randomUUID();
        const { error: insertError } = await supabase.from("payment_invoices").insert({
          id: invoiceId,
          user_id: userId,
          amount,
          status: "pending",
          order_number: orderNumber,
          order_id: (body as CreateInvoiceBody).orderId ?? null,
          provider: "lendmn",
          external_invoice_number: invoiceNumber,
          pending_order_data: pendingOrderData ?? null,
        });

        if (insertError) {
          log.error("[lendmn-debit] DB insert error:", insertError.message);
          return jsonResponse({ success: false, error: "Failed to save invoice record" }, 500);
        }

        return jsonResponse({
          success: true,
          data: {
            invoiceId,
            invoiceNumber,
            orderNumber,
          },
        });
      }

      case "get-invoice": {
        const { invoiceNumber } = body;
        if (!invoiceNumber) {
          return jsonResponse({ error: "Missing invoiceNumber" }, 400);
        }

        const invoice = await lendmnFetch(`/api/payments/invoices/${invoiceNumber}`);

        return jsonResponse({ success: true, data: invoice });
      }

      case "cancel-invoice": {
        const { invoiceNumber: cancelNumber } = body;
        if (!cancelNumber) {
          return jsonResponse({ error: "Missing invoiceNumber" }, 400);
        }

        await lendmnFetch(`/api/payments/invoices/${cancelNumber}`, {
          method: "DELETE",
        });

        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    log.error("[lendmn-debit] Error:", err);
    return jsonResponse(
      {
        error: err instanceof Error ? err.message : "Internal server error",
      },
      500,
    );
  }
});
