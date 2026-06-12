// Shared types for PaymentModal and its sub-modules.
// These are kept here so consumers (checkout page, order detail) can
// import them without pulling the full modal component.

export interface OrderItemPayload {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variantId?: string | null;
  variantName?: string | null;
}

// Hard invariant: this discriminated union drives the modal's state
// machine. "qpay" / "transfer" share the QPay invoice; "lendmn" /
// "storepay" each have their own invoice data shapes. See
// `payment-status.ts` (server actions) for the matching provider arg —
// note that polling collapses "transfer" → "qpay" since transfer is
// just a manual variant of the same invoice.
export type PaymentMethod = "qpay" | "lendmn" | "storepay" | "transfer";

export interface LendMNInvoiceData {
  invoiceId: string;
  invoiceNumber: string;
}

export interface StorePayInvoiceData {
  invoiceId: string;
  loanId: number;
}
