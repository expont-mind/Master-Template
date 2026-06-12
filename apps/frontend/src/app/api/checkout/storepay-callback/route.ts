import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { logPaymentEvent } from "@/lib/payment-logger";
import { getStorePayInvoiceStatus } from "@/lib/storepay/client";
import { log } from "@/lib/utils/logger";

import {
  findInvoiceByLoanId,
  isOrderFullyConfirmed,
  markInvoicePaid,
  runCreateOrderRpc,
  type InvoiceRow,
} from "./_callback-helpers";

import type { Database } from "@/types/database";

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const ok = () => NextResponse.json({ success: true });
const fail = () => NextResponse.json({ success: false }, { status: 500 });

export async function GET(req: NextRequest) {
  try {
    // StorePay sends callback as GET with ?id=loanId
    const loanId = req.nextUrl.searchParams.get("id");

    if (!loanId) {
      return ok();
    }

    return await handleCallback(loanId);
  } catch (err) {
    log.error("storepay_callback_unhandled_error", err);
    await logPaymentEvent({
      provider: "storepay",
      event: "callback_unhandled_error",
      message: err instanceof Error ? err.message : String(err),
    });
    return fail();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const loanId = body.id ?? body.loanId ?? body.loan_id ?? req.nextUrl.searchParams.get("id");

    if (!loanId) {
      return ok();
    }

    return await handleCallback(String(loanId));
  } catch (err) {
    log.error("storepay_callback_unhandled_error", err);
    await logPaymentEvent({
      provider: "storepay",
      event: "callback_unhandled_error",
      message: err instanceof Error ? err.message : String(err),
    });
    return fail();
  }
}

async function handleCallback(loanId: string) {
  await logPaymentEvent({
    provider: "storepay",
    event: "callback_received",
    status: "info",
    metadata: { loanId },
  });

  // Verify payment status directly with StorePay API
  const result = await getStorePayInvoiceStatus(loanId);
  if (!result.paid) return ok();

  const supabase = getAdminClient();
  const invoice = await findInvoiceByLoanId(supabase, loanId);
  if (!invoice) return fail();

  if (invoice.status === "paid") {
    return await handleAlreadyPaidInvoice(supabase, invoice, loanId);
  }

  return await handleFreshlyPaidInvoice(supabase, invoice, loanId, result.amount ?? null);
}

async function handleAlreadyPaidInvoice(
  supabase: ReturnType<typeof getAdminClient>,
  invoice: InvoiceRow,
  loanId: string,
) {
  // Invoice already paid — but check if order was actually confirmed
  if (await isOrderFullyConfirmed(supabase, invoice.order_id)) {
    return ok(); // Fully processed
  }

  // Invoice paid but order not confirmed — retry RPC
  await logPaymentEvent({
    invoiceId: invoice.id,
    orderId: invoice.order_id,
    provider: "storepay",
    event: "rpc_retry",
    status: "info",
    message: "Invoice paid but order not confirmed, retrying RPC",
  });

  const rpc = await runCreateOrderRpc(supabase, invoice, loanId, "retry");
  if (!rpc.ok) return fail();

  await logPaymentEvent({
    invoiceId: invoice.id,
    orderId: invoice.order_id,
    provider: "storepay",
    event: "order_confirmed_on_retry",
    status: "success",
  });

  return ok();
}

async function handleFreshlyPaidInvoice(
  supabase: ReturnType<typeof getAdminClient>,
  invoice: InvoiceRow,
  loanId: string,
  paidAmount: number | null,
) {
  const updated = await markInvoicePaid(supabase, invoice, loanId, paidAmount);
  if (!updated.ok) return fail();

  const rpc = await runCreateOrderRpc(supabase, invoice, loanId, "initial");
  if (!rpc.ok) return fail();

  await logPaymentEvent({
    invoiceId: invoice.id,
    orderId: invoice.order_id,
    provider: "storepay",
    event: "order_confirmed",
    status: "success",
    metadata: { amount: paidAmount },
  });

  return ok();
}
