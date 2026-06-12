// Server-only: calls LendMN API directly (no Edge Function needed)
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/logger";

import type { Json } from "@/types/database";

const LENDMN_API_URL = process.env.LENDMN_API_URL!;
const LENDMN_CLIENT_ID = process.env.LENDMN_CLIENT_ID!;
const LENDMN_CLIENT_SECRET = process.env.LENDMN_CLIENT_SECRET!;
const LENDMN_WALLET_ID = process.env.LENDMN_WALLET_ID!;

// Module-level token cache (persists across warm invocations)
let accessToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  if (!LENDMN_API_URL || !LENDMN_CLIENT_ID || !LENDMN_CLIENT_SECRET) {
    throw new Error(
      `LendMN env vars missing: ${[
        !LENDMN_API_URL && "LENDMN_API_URL",
        !LENDMN_CLIENT_ID && "LENDMN_CLIENT_ID",
        !LENDMN_CLIENT_SECRET && "LENDMN_CLIENT_SECRET",
      ]
        .filter(Boolean)
        .join(", ")}`,
    );
  }

  const res = await fetch(`${LENDMN_API_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: LENDMN_CLIENT_ID,
      client_secret: LENDMN_CLIENT_SECRET,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LendMN auth failed: ${res.status} — ${body}`);
  }

  const data = await res.json();
  accessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000;
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

// -- Create invoice --

export interface CreateLendMNInvoiceParams {
  amount: number;
  description: string;
  phoneNumber: string;
  orderNumber: string;
  userId: string;
  callbackUrl?: string;
  pendingOrderData?: unknown;
  orderId?: string;
}

export interface CreateLendMNInvoiceResult {
  invoiceId: string;
  invoiceNumber: string;
  orderNumber: string;
}

export async function createLendMNInvoice(
  params: CreateLendMNInvoiceParams,
): Promise<CreateLendMNInvoiceResult> {
  const raw = await lendmnFetch<{ response: { invoiceNumber: string } }>("/api/payments/invoices", {
    method: "POST",
    body: JSON.stringify({
      amount: params.amount,
      description: params.description,
      walletId: LENDMN_WALLET_ID,
      phoneNumber: params.phoneNumber,
      ...(params.callbackUrl ? { callbackUrl: params.callbackUrl } : {}),
    }),
  });

  const invoiceNumber = raw.response.invoiceNumber;

  // Save to payment_invoices
  const admin = createAdminClient();
  const invoiceId = crypto.randomUUID();
  const { error: insertError } = await admin.from("payment_invoices").insert({
    id: invoiceId,
    user_id: params.userId,
    amount: params.amount,
    status: "pending",
    order_number: params.orderNumber,
    order_id: params.orderId ?? null,
    provider: "lendmn",
    external_invoice_number: invoiceNumber,
    pending_order_data: (params.pendingOrderData ?? null) as Json,
  });

  if (insertError) {
    log.error("lendmn_invoice_db_insert_failed", { message: insertError.message });
    throw new Error(`Failed to save invoice to database: ${insertError.message}`);
  }

  return {
    invoiceId,
    invoiceNumber,
    orderNumber: params.orderNumber,
  };
}

// -- Check invoice status --

export async function getLendMNInvoiceStatus(
  invoiceNumber: string,
): Promise<{ paid: boolean; amount?: number }> {
  const data = await lendmnFetch<Record<string, unknown>>(
    `/api/payments/invoices/${invoiceNumber}`,
  );

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
    amount: (data.amount ?? data.paidAmount ?? data.paid_amount) as number | undefined,
  };
}
