// Pure selectors that resolve the active invoice id for the current
// PaymentMethod. Kept out of usePaymentPolling so the hook body stays
// under the max-lines-per-function limit.

import type { LendMNInvoiceData, PaymentMethod, StorePayInvoiceData } from "./types";
import type { QPayInvoiceData } from "@/lib/qpay/types";

interface InvoiceSources {
  paymentMethod: PaymentMethod;
  invoiceData: QPayInvoiceData | null;
  lendmnInvoiceData: LendMNInvoiceData | null;
  storepayInvoiceData: StorePayInvoiceData | null;
}

export function resolveCurrentInvoiceId(src: InvoiceSources): string | undefined {
  if (src.paymentMethod === "lendmn") return src.lendmnInvoiceData?.invoiceId;
  if (src.paymentMethod === "storepay") return src.storepayInvoiceData?.invoiceId;
  return src.invoiceData?.id;
}

export function resolveHasInvoice(src: InvoiceSources): boolean {
  if (src.paymentMethod === "lendmn") return !!src.lendmnInvoiceData?.invoiceId;
  if (src.paymentMethod === "storepay") return !!src.storepayInvoiceData?.invoiceId;
  return !!src.invoiceData?.id;
}

// "transfer" piggy-backs on the QPay invoice for polling; the manual
// "Төлсөн бол дар" button is the actual confirmation path.
export function resolveProviderForCheck(paymentMethod: PaymentMethod) {
  return paymentMethod === "transfer" ? "qpay" : paymentMethod;
}
