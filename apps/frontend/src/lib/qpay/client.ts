import type { QPayInvoiceData, QPayPaymentCheckResponse, CreateInvoiceParams } from "./types";

const QUICKPAY_API_URL = process.env.QUICKPAY_API_URL!;
const QUICKPAY_API_KEY = process.env.QUICKPAY_API_KEY!;
const QUICKPAY_MERCHANT_ID = process.env.QUICKPAY_MERCHANT_ID!;
const QUICKPAY_MCC_CODE = process.env.QUICKPAY_MCC_CODE || "5812";
const QUICKPAY_BANK_CODE = process.env.QUICKPAY_BANK_CODE || "050000";
const QUICKPAY_ACCOUNT_NUMBER = process.env.QUICKPAY_ACCOUNT_NUMBER!;
const QUICKPAY_ACCOUNT_NAME = process.env.QUICKPAY_ACCOUNT_NAME!;

async function qpayFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${QUICKPAY_API_URL}${endpoint}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${QUICKPAY_API_KEY}`,
      "X-QPay-Merchant-Id": QUICKPAY_MERCHANT_ID,
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    let message = json.error?.message || `QPay API error: ${res.status}`;
    if (json.error?.details) {
      message += `: ${JSON.stringify(json.error.details)}`;
    }
    throw new Error(message);
  }

  return json.data as T;
}

export async function createInvoice(params: CreateInvoiceParams): Promise<QPayInvoiceData> {
  const body: Record<string, unknown> = {
    merchant_id: QUICKPAY_MERCHANT_ID,
    amount: params.amount,
    currency: "MNT",
    mcc_code: QUICKPAY_MCC_CODE,
    description: params.description,
    bank_accounts: [
      {
        account_bank_code: QUICKPAY_BANK_CODE,
        account_number: QUICKPAY_ACCOUNT_NUMBER,
        account_name: QUICKPAY_ACCOUNT_NAME,
        is_default: true,
      },
    ],
  };

  if (params.customerName) body.customer_name = params.customerName;
  if (params.callbackUrl) body.callback_url = params.callbackUrl;

  return qpayFetch<QPayInvoiceData>("/api/qpay/invoices", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function checkPayment(invoiceId: string): Promise<QPayPaymentCheckResponse> {
  return qpayFetch<QPayPaymentCheckResponse>("/api/qpay/payments/check", {
    method: "POST",
    body: JSON.stringify({ invoice_id: invoiceId }),
  });
}

export async function getInvoice(invoiceId: string): Promise<QPayInvoiceData> {
  return qpayFetch<QPayInvoiceData>(`/api/qpay/invoices/${invoiceId}`);
}
