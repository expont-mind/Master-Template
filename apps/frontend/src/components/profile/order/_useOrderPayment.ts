"use client";

import { useState } from "react";

import { createInvoiceForExistingOrder } from "@/components/checkout/actions";

import type { QPayInvoiceData } from "@/lib/qpay/types";

interface UseOrderPaymentResult {
  isPaymentModalOpen: boolean;
  invoiceData: QPayInvoiceData | null;
  isCreatingInvoice: boolean;
  createError: string | null;
  retryTotalAmount: number | null;
  handlePaymentClick: () => Promise<void>;
  closePaymentModal: () => void;
  handlePaymentSuccess: () => void;
}

/**
 * State and handlers for retrying payment on an existing unpaid order.
 * `handlePaymentSuccess` reloads the page so the order detail reflects
 * the updated payment + delivery status.
 */
export function useOrderPayment(orderId: string): UseOrderPaymentResult {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<QPayInvoiceData | null>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [retryTotalAmount, setRetryTotalAmount] = useState<number | null>(null);

  const handlePaymentClick = async () => {
    setIsCreatingInvoice(true);
    setCreateError(null);
    setIsPaymentModalOpen(true);

    const result = await createInvoiceForExistingOrder(orderId);

    if (result.success && result.data) {
      setInvoiceData(result.data.invoice);
      setRetryTotalAmount(result.data.totalAmount);
    } else {
      setCreateError(result.error || "Төлбөрийн нэхэмжлэл үүсгэхэд алдаа гарлаа");
    }

    setIsCreatingInvoice(false);
  };

  const closePaymentModal = () => setIsPaymentModalOpen(false);

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    window.location.reload();
  };

  return {
    isPaymentModalOpen,
    invoiceData,
    isCreatingInvoice,
    createError,
    retryTotalAmount,
    handlePaymentClick,
    closePaymentModal,
    handlePaymentSuccess,
  };
}
