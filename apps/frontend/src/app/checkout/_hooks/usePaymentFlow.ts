"use client";

import { useCallback, useMemo, useState } from "react";

import { updateOrderPaymentMethod } from "@/components/checkout/actions";

import {
  runFreeOrderFlow,
  runLendMNInvoiceFlow,
  runQPayInvoiceFlow,
  runStorePayInvoiceFlow,
  type FlowSetters,
} from "./_paymentInvoiceCreators";

import type {
  PaymentMethod,
  OrderItemPayload,
  LendMNInvoiceData,
  StorePayInvoiceData,
} from "@/components/checkout/PaymentModal";
import type { QPayInvoiceData } from "@/lib/qpay/types";
import type { SelectedCoupon } from "@/stores/cart-store";

interface ContactInfo {
  firstName: string;
  lastName: string;
}

interface AddressInfo {
  city: string;
  district: string;
  sub_district: string;
  detail: string;
}

interface UsePaymentFlowInput {
  totalPayable: number;
  couponDiscount: number;
  pointDiscount: number;
  selectedCoupon: SelectedCoupon | null;
  contact: ContactInfo;
  address: AddressInfo;
  phone1: string;
  phone2: string;
  orderItemsPayload: OrderItemPayload[];
  syncToSupabase: (info: ContactInfo & { phone1: string; phone2: string }) => Promise<boolean>;
  onSuccess: () => void;
}

interface UsePaymentFlowReturn {
  paymentMethod: PaymentMethod;
  invoiceData: QPayInvoiceData | null;
  lendmnInvoiceData: LendMNInvoiceData | null;
  storepayInvoiceData: StorePayInvoiceData | null;
  isCreatingInvoice: boolean;
  invoiceError: string | null;
  orderNumber: string | null;
  orderId: string | null;
  freeOrderSuccess: boolean;
  showPaymentModal: boolean;
  startPayment: () => Promise<void>;
  selectLendMN: () => Promise<void>;
  selectStorePay: () => Promise<void>;
  selectTransfer: () => Promise<void>;
  reselectQPay: () => Promise<void>;
  closePaymentModal: () => void;
  handlePaymentSuccess: () => void;
}

/**
 * Encapsulates the checkout payment flow:
 *   - State for QPay / LendMN / StorePay invoice data
 *   - Free-order shortcut (skips payment gateway when total = 0)
 *   - Provider selection handlers
 *   - Modal open/close lifecycle
 *
 * Caller (CheckoutPage) only wires totals + contact + items in, and renders
 * the modal with the returned state. No business logic leaks into the page.
 */
export function usePaymentFlow(input: UsePaymentFlowInput): UsePaymentFlowReturn {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("qpay");
  const [invoiceData, setInvoiceData] = useState<QPayInvoiceData | null>(null);
  const [lendmnInvoiceData, setLendmnInvoiceData] = useState<LendMNInvoiceData | null>(null);
  const [storepayInvoiceData, setStorepayInvoiceData] = useState<StorePayInvoiceData | null>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [freeOrderSuccess, setFreeOrderSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const setters = useMemo<FlowSetters>(
    () => ({
      setIsCreatingInvoice,
      setInvoiceError,
      setFreeOrderSuccess,
      setInvoiceData,
      setLendmnInvoiceData,
      setStorepayInvoiceData,
      setOrderNumber,
      setOrderId,
      setShowPaymentModal,
      setPaymentMethod,
    }),
    [],
  );

  const startPayment = useCallback(async () => {
    if (isCreatingInvoice) return;
    const synced = await input.syncToSupabase({
      lastName: input.contact.lastName,
      firstName: input.contact.firstName,
      phone1: input.phone1,
      phone2: input.phone2,
    });
    if (!synced) return;

    if (input.totalPayable === 0) {
      await runFreeOrderFlow(input, setters);
      return;
    }
    await runQPayInvoiceFlow(input, setters);
  }, [isCreatingInvoice, input, setters]);

  const selectLendMN = useCallback(async () => {
    if (isCreatingInvoice) return;
    await runLendMNInvoiceFlow(input, setters);
  }, [isCreatingInvoice, input, setters]);

  const selectStorePay = useCallback(async () => {
    if (isCreatingInvoice) return;
    await runStorePayInvoiceFlow(input, setters);
  }, [isCreatingInvoice, input, setters]);

  const selectTransfer = useCallback(async () => {
    if (!orderId) return;
    setPaymentMethod("transfer");
    await updateOrderPaymentMethod(orderId, "transfer");
  }, [orderId]);

  const reselectQPay = useCallback(async () => {
    if (!orderId) return;
    setPaymentMethod("qpay");
    await updateOrderPaymentMethod(orderId, "qpay");
  }, [orderId]);

  const closePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    input.onSuccess();
  }, [input]);

  return {
    paymentMethod,
    invoiceData,
    lendmnInvoiceData,
    storepayInvoiceData,
    isCreatingInvoice,
    invoiceError,
    orderNumber,
    orderId,
    freeOrderSuccess,
    showPaymentModal,
    startPayment,
    selectLendMN,
    selectStorePay,
    selectTransfer,
    reselectQPay,
    closePaymentModal,
    handlePaymentSuccess,
  };
}
