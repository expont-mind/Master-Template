"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import {
  checkLendMNStatus,
  checkQPayStatus,
  checkStorePayStatus,
  type PaymentStatusResult,
} from "./_paymentStatusCheckers";
import {
  buildRecoveryWindow,
  fetchPaidRecoverableInvoices,
  fetchPendingRecoverableInvoices,
  recoverSingleInvoice,
  type RecoverableInvoice,
} from "./_pendingInvoiceRecovery";

async function isInvoicePaidInDb(invoiceId: string): Promise<boolean> {
  const supabase = await createClient();
  try {
    const { data: invoice } = await supabase
      .from("payment_invoices")
      .select("status")
      .eq("id", invoiceId)
      .single();
    return invoice?.status === "paid";
  } catch {
    // DB exception - treat as not yet paid; provider check will follow
    return false;
  }
}

export async function checkPaymentStatus(
  invoiceId: string,
  provider: "qpay" | "lendmn" | "storepay" = "qpay",
): Promise<PaymentStatusResult> {
  // 1) Check our DB first (updated by callback)
  if (await isInvoicePaidInDb(invoiceId)) {
    return { success: true, paid: true };
  }

  // 2) Dispatch to the provider-specific status checker
  if (provider === "lendmn") return checkLendMNStatus(invoiceId);
  if (provider === "storepay") return checkStorePayStatus(invoiceId);
  return checkQPayStatus(invoiceId);
}

export async function recoverPendingInvoices(): Promise<{
  recovered: number;
  checked: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { recovered: 0, checked: 0 };

  const admin = createAdminClient();
  const window = buildRecoveryWindow();

  const { data: paidInvoices, error: fetchError } = await fetchPaidRecoverableInvoices(
    admin,
    user.id,
    window,
  );

  const { data: pendingInvoices } = await fetchPendingRecoverableInvoices(admin, user.id, window);

  const allInvoices: RecoverableInvoice[] = [...(paidInvoices ?? []), ...(pendingInvoices ?? [])];

  if (fetchError || !allInvoices.length) {
    return { recovered: 0, checked: 0 };
  }

  let recovered = 0;
  for (const inv of allInvoices) {
    const ok = await recoverSingleInvoice(admin, inv, checkPaymentStatus);
    if (ok) recovered++;
  }

  return { recovered, checked: allInvoices.length };
}
