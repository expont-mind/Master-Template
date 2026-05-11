// Server-only: calls StorePay API directly (no Edge Function needed)
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

const STOREPAY_API_URL = process.env.STOREPAY_API_URL!;
const STOREPAY_AUTH_URL = process.env.STOREPAY_AUTH_URL!;
const STOREPAY_USERNAME = process.env.STOREPAY_USERNAME!;
const STOREPAY_PASSWORD = process.env.STOREPAY_PASSWORD!;
const STOREPAY_APP_USERNAME = process.env.STOREPAY_APP_USERNAME!;
const STOREPAY_APP_PASSWORD = process.env.STOREPAY_APP_PASSWORD!;
const STOREPAY_STORE_ID = process.env.STOREPAY_STORE_ID!;

// Module-level token cache (persists across warm invocations)
let accessToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  if (!STOREPAY_AUTH_URL || !STOREPAY_USERNAME || !STOREPAY_PASSWORD) {
    throw new Error(
      `StorePay env vars missing: ${[
        !STOREPAY_AUTH_URL && "STOREPAY_AUTH_URL",
        !STOREPAY_USERNAME && "STOREPAY_USERNAME",
        !STOREPAY_PASSWORD && "STOREPAY_PASSWORD",
        !STOREPAY_APP_USERNAME && "STOREPAY_APP_USERNAME",
        !STOREPAY_APP_PASSWORD && "STOREPAY_APP_PASSWORD",
      ]
        .filter(Boolean)
        .join(", ")}`,
    );
  }

  const basicAuth = Buffer.from(
    `${STOREPAY_APP_USERNAME}:${STOREPAY_APP_PASSWORD}`,
  ).toString("base64");

  const authUrl = `${STOREPAY_AUTH_URL}?grant_type=password&username=${encodeURIComponent(STOREPAY_USERNAME)}&password=${encodeURIComponent(STOREPAY_PASSWORD)}`;

  const res = await fetch(authUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`StorePay auth failed: ${res.status} — ${body}`);
  }

  const data = await res.json();
  accessToken = data.access_token;
  // Token expires in 7200s (120 min), refresh 60s early
  tokenExpiresAt = Date.now() + (data.expires_in ?? 7200) * 1000 - 60_000;
  return accessToken!;
}

async function storepayFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${STOREPAY_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      `StorePay API error ${res.status}: ${JSON.stringify(json)}`,
    );
  }

  return json as T;
}

// -- StorePay response types --

interface StorePayResponse {
  value: number | null;
  msgList: Array<{ code: string; text: string | null; params: string | null }>;
  attrs: Record<string, unknown>;
  status: "Success" | "Failed";
}

interface StorePayCheckResponse {
  value: boolean;
  data: {
    loanId: number;
    status: string; // "pending" | "confirmed"
    amount: string;
    description: string;
    storeId: number;
    number: string;
    isExist: boolean;
    isConfirmed: boolean;
  };
  msgList: Array<unknown>;
  attrs: Record<string, unknown>;
  status: "Success" | "Failed";
}

// -- Create invoice --

export interface CreateStorePayInvoiceParams {
  amount: number;
  description: string;
  mobileNumber: string;
  orderNumber: string;
  userId: string;
  callbackUrl?: string;
  pendingOrderData?: unknown;
  orderId?: string;
}

export interface CreateStorePayInvoiceResult {
  invoiceId: string;
  loanId: number;
  orderNumber: string;
}

export async function createStorePayInvoice(
  params: CreateStorePayInvoiceParams,
): Promise<CreateStorePayInvoiceResult> {
  const requestId = crypto.randomUUID();

  const raw = await storepayFetch<StorePayResponse>("/merchant/loan", {
    method: "POST",
    body: JSON.stringify({
      storeId: STOREPAY_STORE_ID,
      mobileNumber: params.mobileNumber,
      description: params.description,
      amount: params.amount,
      callbackUrl: params.callbackUrl ?? "",
      requestId,
    }),
  });

  if (raw.status !== "Success" || raw.value == null) {
    const errorMsg =
      raw.msgList?.[0]?.code ?? "StorePay нэхэмжлэл үүсгэхэд алдаа гарлаа";
    throw new Error(errorMsg);
  }

  const loanId = raw.value;

  // Save to payment_invoices
  const admin = createAdminClient();
  const invoiceId = crypto.randomUUID();
  const { error: insertError } = await admin
    .from("payment_invoices")
    .insert({
      id: invoiceId,
      user_id: params.userId,
      amount: params.amount,
      status: "pending",
      order_number: params.orderNumber,
      order_id: params.orderId ?? null,
      provider: "storepay",
      external_invoice_number: String(loanId),
      pending_order_data: (params.pendingOrderData ?? null) as Json,
    });

  if (insertError) {
    console.error("[storepay] DB insert error:", insertError.message);
    throw new Error(`Failed to save invoice to database: ${insertError.message}`);
  }

  return {
    invoiceId,
    loanId,
    orderNumber: params.orderNumber,
  };
}

// -- Check invoice status by loan ID --

export async function getStorePayInvoiceStatus(
  loanId: string,
): Promise<{ paid: boolean; amount?: number }> {
  const data = await storepayFetch<StorePayCheckResponse>(
    `/merchant/loan/check/${loanId}`,
  );

  const isPaid =
    data.status === "Success" &&
    data.value === true &&
    data.data?.isConfirmed === true;

  return {
    paid: isPaid,
    amount: data.data?.amount ? parseFloat(data.data.amount) : undefined,
  };
}
