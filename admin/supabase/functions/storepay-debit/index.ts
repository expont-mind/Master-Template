import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const STOREPAY_API_URL = Deno.env.get("STOREPAY_API_URL")!;
const STOREPAY_AUTH_URL = Deno.env.get("STOREPAY_AUTH_URL")!;
const STOREPAY_USERNAME = Deno.env.get("STOREPAY_USERNAME")!;
const STOREPAY_PASSWORD = Deno.env.get("STOREPAY_PASSWORD")!;
const STOREPAY_APP_USERNAME = Deno.env.get("STOREPAY_APP_USERNAME")!;
const STOREPAY_APP_PASSWORD = Deno.env.get("STOREPAY_APP_PASSWORD")!;
const STOREPAY_STORE_ID = Deno.env.get("STOREPAY_STORE_ID")!;
const NEXT_PUBLIC_SITE_URL = Deno.env.get("NEXT_PUBLIC_SITE_URL")!;

// Module-level token cache (persists across warm invocations)
let accessToken: string | null = null;
let tokenExpiresAt = 0;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const basicAuth = btoa(`${STOREPAY_APP_USERNAME}:${STOREPAY_APP_PASSWORD}`);
  const authUrl = `${STOREPAY_AUTH_URL}?grant_type=password&username=${encodeURIComponent(STOREPAY_USERNAME)}&password=${encodeURIComponent(STOREPAY_PASSWORD)}`;

  const res = await fetch(authUrl, {
    method: "POST",
    headers: { Authorization: `Basic ${basicAuth}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`StorePay auth failed: ${res.status} — ${body}`);
  }

  const data = await res.json();
  const token = data.access_token;
  if (!token) throw new Error("StorePay auth: no access_token in response");

  accessToken = token;
  // Token expires in 7200s (120 min), refresh 60s early
  tokenExpiresAt = Date.now() + (data.expires_in ?? 7200) * 1000 - 60_000;
  return accessToken!;
}

async function storepayFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${STOREPAY_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      `StorePay API error ${res.status}: ${JSON.stringify(json)}`
    );
  }
  return json as T;
}

interface StorePayLoanResponse {
  value: number | null;
  msgList: Array<{ code: string; text: string | null; params: string | null }>;
  attrs: Record<string, unknown>;
  status: "Success" | "Failed";
}

// ─── Main handler ────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ success: false, error: "Нэвтэрнэ үү" }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const {
      action,
      amount,
      description,
      phoneNumber,
      orderNumber,
      userId,
      orderId,
    } = (await req.json()) as {
      action: string;
      amount?: number;
      description?: string;
      phoneNumber?: string;
      orderNumber?: string;
      userId?: string;
      orderId?: string;
    };

    if (action !== "create-invoice") {
      return jsonResponse(
        { success: false, error: `Unknown action: ${action}` },
        400
      );
    }

    if (!amount || !phoneNumber || !orderNumber || !userId) {
      return jsonResponse(
        { success: false, error: "amount, phoneNumber, orderNumber, userId шаардлагатай" },
        400
      );
    }

    const callbackUrl = `${NEXT_PUBLIC_SITE_URL}/api/checkout/storepay-callback`;
    const requestId = crypto.randomUUID();

    const raw = await storepayFetch<StorePayLoanResponse>("/merchant/loan", {
      method: "POST",
      body: JSON.stringify({
        storeId: STOREPAY_STORE_ID,
        mobileNumber: phoneNumber,
        description: description ?? `Monpang захиалга: ${orderNumber}`,
        amount,
        callbackUrl,
        requestId,
      }),
    });

    if (raw.status !== "Success" || raw.value == null) {
      const errorMsg =
        raw.msgList?.[0]?.code ?? "StorePay нэхэмжлэл үүсгэхэд алдаа гарлаа";
      return jsonResponse({ success: false, error: errorMsg }, 400);
    }

    const loanId = raw.value;
    const invoiceId = crypto.randomUUID();

    const { error: insertError } = await supabase
      .from("payment_invoices")
      .insert({
        id: invoiceId,
        user_id: userId,
        amount,
        status: "pending",
        order_number: orderNumber,
        order_id: orderId ?? null,
        provider: "storepay",
        external_invoice_number: String(loanId),
      });

    if (insertError) {
      console.error("[storepay-debit] DB insert error:", insertError.message);
      return jsonResponse(
        { success: false, error: "Failed to save invoice record" },
        500
      );
    }

    return jsonResponse({
      success: true,
      data: { invoiceId, loanId },
    });
  } catch (err) {
    console.error("[storepay-debit] Error:", err);
    return jsonResponse(
      {
        success: false,
        error: err instanceof Error ? err.message : "Алдаа гарлаа",
      },
      500
    );
  }
});
