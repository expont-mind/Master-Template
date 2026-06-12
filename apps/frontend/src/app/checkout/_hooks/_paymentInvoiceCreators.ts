// Pure helpers used by usePaymentFlow. Each function takes a small
// "deps" bag and the current input, then returns the invoice-creator
// callback or runs it. Extracted so the hook body stays under
// max-lines-per-function.

import {
  createCheckoutInvoice,
  createFreeOrder,
  createLendMNCheckoutInvoice,
  createStorePayCheckoutInvoice,
} from "@/components/checkout/actions";

import type {
  LendMNInvoiceData,
  OrderItemPayload,
  StorePayInvoiceData,
} from "@/components/checkout/PaymentModal";
import type { QPayInvoiceData } from "@/lib/qpay/types";
import type { SelectedCoupon } from "@/stores/cart-store";

export interface ContactInfo {
  firstName: string;
  lastName: string;
}

export interface AddressInfo {
  city: string;
  district: string;
  sub_district: string;
  detail: string;
}

export interface InvoiceFlowInput {
  totalPayable: number;
  couponDiscount: number;
  pointDiscount: number;
  selectedCoupon: SelectedCoupon | null;
  contact: ContactInfo;
  address: AddressInfo;
  phone1: string;
  orderItemsPayload: OrderItemPayload[];
  onSuccess: () => void;
}

export interface FlowSetters {
  setIsCreatingInvoice: (b: boolean) => void;
  setInvoiceError: (s: string | null) => void;
  setFreeOrderSuccess: (b: boolean) => void;
  setInvoiceData: (d: QPayInvoiceData | null) => void;
  setLendmnInvoiceData: (d: LendMNInvoiceData | null) => void;
  setStorepayInvoiceData: (d: StorePayInvoiceData | null) => void;
  setOrderNumber: (s: string | null) => void;
  setOrderId: (s: string | null) => void;
  setShowPaymentModal: (b: boolean) => void;
  setPaymentMethod: (p: "qpay" | "lendmn" | "storepay" | "transfer") => void;
}

export async function runFreeOrderFlow(input: InvoiceFlowInput, s: FlowSetters): Promise<void> {
  s.setIsCreatingInvoice(true);
  s.setInvoiceError(null);

  const freeResult = await createFreeOrder({
    total: 0,
    couponDiscount: input.couponDiscount,
    pointDiscount: input.pointDiscount,
    couponId: input.selectedCoupon?.coupon_id ?? null,
    pointsUsed: input.pointDiscount,
    contact: input.contact,
    items: input.orderItemsPayload,
    address: input.address,
  });

  s.setIsCreatingInvoice(false);

  if (freeResult.success) {
    s.setFreeOrderSuccess(true);
    input.onSuccess();
  } else {
    s.setInvoiceError(freeResult.error);
  }
}

export async function runQPayInvoiceFlow(input: InvoiceFlowInput, s: FlowSetters): Promise<void> {
  s.setPaymentMethod("qpay");
  s.setInvoiceData(null);
  s.setLendmnInvoiceData(null);
  s.setStorepayInvoiceData(null);
  s.setInvoiceError(null);
  s.setOrderNumber(null);
  s.setOrderId(null);
  s.setIsCreatingInvoice(true);
  s.setShowPaymentModal(true);

  const result = await createCheckoutInvoice({
    total: input.totalPayable,
    couponDiscount: input.couponDiscount,
    pointDiscount: input.pointDiscount,
    couponId: input.selectedCoupon?.coupon_id ?? null,
    pointsUsed: input.pointDiscount,
    contact: input.contact,
    items: input.orderItemsPayload,
    address: input.address,
  });

  s.setIsCreatingInvoice(false);

  if (result.success) {
    s.setInvoiceData(result.data.invoice);
    s.setOrderNumber(result.data.orderNumber);
    s.setOrderId(result.data.orderId);
  } else {
    s.setInvoiceError(result.error);
  }
}

export async function runLendMNInvoiceFlow(input: InvoiceFlowInput, s: FlowSetters): Promise<void> {
  s.setPaymentMethod("lendmn");
  s.setLendmnInvoiceData(null);
  s.setInvoiceError(null);
  s.setIsCreatingInvoice(true);

  const result = await createLendMNCheckoutInvoice({
    total: input.totalPayable,
    couponDiscount: input.couponDiscount,
    pointDiscount: input.pointDiscount,
    couponId: input.selectedCoupon?.coupon_id ?? null,
    pointsUsed: input.pointDiscount,
    contact: input.contact,
    phoneNumber: input.phone1,
    items: input.orderItemsPayload,
    address: input.address,
  });

  s.setIsCreatingInvoice(false);

  if (result.success) {
    s.setLendmnInvoiceData({
      invoiceId: result.data.invoiceId,
      invoiceNumber: result.data.invoiceNumber,
    });
    s.setOrderNumber(result.data.orderNumber);
    s.setOrderId(result.data.orderId);
  } else {
    s.setInvoiceError(result.error);
  }
}

export async function runStorePayInvoiceFlow(
  input: InvoiceFlowInput,
  s: FlowSetters,
): Promise<void> {
  s.setPaymentMethod("storepay");
  s.setStorepayInvoiceData(null);
  s.setInvoiceError(null);
  s.setIsCreatingInvoice(true);

  const result = await createStorePayCheckoutInvoice({
    total: input.totalPayable,
    couponDiscount: input.couponDiscount,
    couponId: input.selectedCoupon?.coupon_id ?? null,
    contact: input.contact,
    phoneNumber: input.phone1,
    items: input.orderItemsPayload,
    address: input.address,
  });

  s.setIsCreatingInvoice(false);

  if (result.success) {
    s.setStorepayInvoiceData({
      invoiceId: result.data.invoiceId,
      loanId: result.data.loanId,
    });
    s.setOrderNumber(result.data.orderNumber);
    s.setOrderId(result.data.orderId);
  } else {
    s.setInvoiceError(result.error);
  }
}
