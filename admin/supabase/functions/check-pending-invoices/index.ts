import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Module-level token cache (LendMN)
let accessToken: string | null = null;
let tokenExpiresAt = 0;

// Module-level token cache (StorePay)
let storepayToken: { token: string; expiresAt: number } | null = null;

async function getLendMNAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

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
    payments: {
      id: string;
      amount: string;
      paid_by: string;
      transactions: {
        id: string;
        amount: string;
        status: string;
      }[];
    }[];
  };
}

async function verifyInvoiceWithLendMN(
  invoiceNumber: string,
): Promise<{ paid: boolean; amount?: number; transactionId?: string; wallet?: string }> {
  const token = await getLendMNAccessToken();

  const res = await fetch(
    `${LENDMN_API_URL}/api/payments/invoices/${invoiceNumber}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    throw new Error(`LendMN verify failed: ${res.status}`);
  }

  const data = await res.json();

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

async function verifyPaymentWithStorePay(
  loanId: string,
): Promise<{ paid: boolean; amount: number | null }> {
  const token = await getStorePayToken();

  const res = await fetch(`${STOREPAY_API_URL}/merchant/loan/check/${loanId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`StorePay check failed: ${res.status}`);
  }

  const isPaid =
    json.status === "Success" &&
    json.value === true &&
    json.data?.isConfirmed === true;

  const amount = json.data?.amount ? parseFloat(json.data.amount) : null;

  return { paid: isPaid, amount };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Fetch pending invoices: older than 5 min (give client polling a chance), younger than 2 hours
  const { data: invoices, error } = await supabase
    .from("payment_invoices")
    .select("id, provider, external_invoice_number, status")
    .eq("status", "pending")
    .lt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
    .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error("[check-pending] Query error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let processed = 0;
  let paid = 0;
  let expired = 0;

  for (const invoice of invoices ?? []) {
    try {
      if (invoice.provider === "qpay") {
        // QPay: invoice.id is used as the QPay invoice_id
        const result = await verifyPaymentWithQPay(invoice.id);
        const isPaid = result.invoice_status === "PAID";
        const payment = result.payments?.[0];
        const paidAmount = payment ? parseFloat(payment.amount) : 0;

        if (isPaid && paidAmount > 0) {
          await supabase
            .from("payment_invoices")
            .update({
              status: "paid",
              paid_amount: paidAmount,
              transaction_id: payment?.transactions?.[0]?.id ?? null,
              payment_wallet: payment?.paid_by ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", invoice.id);

          const { data: rpcData, error: rpcError } = await supabase.rpc("create_order_from_invoice", {
            p_invoice_id: invoice.id,
          });

          if (rpcError) {
            console.error(`[check-pending] RPC error for invoice ${invoice.id}:`, rpcError.message);
          } else {
            const rpcResult = rpcData as { success: boolean; error?: string } | null;
            if (rpcResult && !rpcResult.success) {
              console.error(`[check-pending] RPC failure for invoice ${invoice.id}:`, rpcResult.error);
            }
          }

          paid++;
        }
      } else if (invoice.provider === "lendmn") {
        // LendMN: uses external_invoice_number
        if (!invoice.external_invoice_number) {
          continue;
        }

        const result = await verifyInvoiceWithLendMN(invoice.external_invoice_number);

        if (result.paid) {
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

          const { data: rpcData, error: rpcError } = await supabase.rpc("create_order_from_invoice", {
            p_invoice_id: invoice.id,
          });

          if (rpcError) {
            console.error(`[check-pending] RPC error for invoice ${invoice.id}:`, rpcError.message);
          } else {
            const rpcResult = rpcData as { success: boolean; error?: string } | null;
            if (rpcResult && !rpcResult.success) {
              console.error(`[check-pending] RPC failure for invoice ${invoice.id}:`, rpcResult.error);
            }
          }

          paid++;
        }
      } else if (invoice.provider === "storepay") {
        // StorePay: uses external_invoice_number (loanId)
        if (!invoice.external_invoice_number) {
          continue;
        }

        const result = await verifyPaymentWithStorePay(invoice.external_invoice_number);

        if (result.paid) {
          await supabase
            .from("payment_invoices")
            .update({
              status: "paid",
              paid_amount: result.amount ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", invoice.id);

          const { data: rpcData, error: rpcError } = await supabase.rpc("create_order_from_invoice", {
            p_invoice_id: invoice.id,
          });

          if (rpcError) {
            console.error(`[check-pending] RPC error for invoice ${invoice.id}:`, rpcError.message);
          } else {
            const rpcResult = rpcData as { success: boolean; error?: string } | null;
            if (rpcResult && !rpcResult.success) {
              console.error(`[check-pending] RPC failure for invoice ${invoice.id}:`, rpcResult.error);
            }
          }

          paid++;
        }
      }

      processed++;
    } catch (err) {
      console.error(`[check-pending] Error processing invoice ${invoice.id}:`, err);
    }
  }

  // Expire QPay invoices older than 2 hours
  const { data: expiredQpay } = await supabase
    .from("payment_invoices")
    .update({
      status: "expired",
      updated_at: new Date().toISOString(),
    })
    .eq("status", "pending")
    .eq("provider", "qpay")
    .lt("created_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
    .select("id");

  // Expire StorePay & LendMN invoices older than 24 hours
  const { data: expiredOther } = await supabase
    .from("payment_invoices")
    .update({
      status: "expired",
      updated_at: new Date().toISOString(),
    })
    .eq("status", "pending")
    .in("provider", ["storepay", "lendmn"])
    .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .select("id");

  expired = (expiredQpay?.length ?? 0) + (expiredOther?.length ?? 0);

  return new Response(
    JSON.stringify({
      success: true,
      processed,
      paid,
      expired,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
});
