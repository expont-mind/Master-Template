"use client";

// Orchestrator for the payment flow. Owns state, polling, and the modal
// lifecycle; delegates rendering to two presentational view components:
//   - PaymentModalMobile (bottom drawer)
//   - PaymentModalDesktop (centered modal)
// Their shared prop shape lives in ./payment/PaymentModalShared.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useScrollLock } from "@/lib/hooks/useScrollLock";

import { PaymentModalDesktop } from "./payment/PaymentModalDesktop";
import { PaymentModalMobile } from "./payment/PaymentModalMobile";
import { PaymentSuccessView } from "./payment/PaymentSuccessView";
import { usePaymentPolling } from "./payment/usePaymentPolling";

import type { PaymentModalViewProps } from "./payment/PaymentModalShared";
import type {
  LendMNInvoiceData,
  OrderItemPayload,
  PaymentMethod,
  StorePayInvoiceData,
} from "./payment/types";
import type { QPayInvoiceData } from "@/lib/qpay/types";

// Re-export so existing consumers can keep importing from PaymentModal.
// (checkout/page.tsx and profile/OrderDetailView.tsx both import these.)
export type { LendMNInvoiceData, OrderItemPayload, PaymentMethod, StorePayInvoiceData };

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  invoiceData: QPayInvoiceData | null;
  lendmnInvoiceData: LendMNInvoiceData | null;
  storepayInvoiceData: StorePayInvoiceData | null;
  paymentMethod: PaymentMethod;
  isCreating: boolean;
  createError: string | null;
  orderItems: OrderItemPayload[];
  orderNumber: string | null;
  orderId: string | null;
  phoneNumber?: string;
  couponId?: string | null;
  couponDiscount?: number;
  pointsUsed?: number;
  pointDiscount?: number;
  onPaymentSuccess: () => void;
  onLendMNSelect?: () => void;
  onStorePaySelect?: () => void;
  onTransferSelect?: () => void;
  onQPayReselect?: () => void;
}

// LoadingSpinner now lives in ./payment/PaymentModalShared so both the mobile
// and desktop views can import it without circular dependencies.

export function PaymentModal({
  isOpen,
  onClose,
  totalAmount,
  invoiceData,
  lendmnInvoiceData,
  storepayInvoiceData,
  paymentMethod,
  isCreating,
  createError,
  orderItems,
  orderNumber,
  orderId,
  phoneNumber,
  couponId,
  couponDiscount,
  pointsUsed,
  pointDiscount,
  onPaymentSuccess,
  onLendMNSelect,
  onStorePaySelect,
  onTransferSelect,
  onQPayReselect,
}: PaymentModalProps) {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [activeTab, setActiveTab] = useState<"qr" | "bank">("qr");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [transferSubmitted, setTransferSubmitted] = useState(false);

  const {
    hasInvoice,
    paid,
    manualCheck: handleManualCheck,
    checking,
    checkFailed,
    checkError,
  } = usePaymentPolling({
    isOpen,
    paymentMethod,
    invoiceData,
    lendmnInvoiceData,
    storepayInvoiceData,
    orderId,
    orderItems,
    totalAmount,
    couponId,
    couponDiscount,
    pointsUsed,
    pointDiscount,
    onPaymentSuccess,
  });

  useScrollLock(visible);

  useEffect(() => {
    if (isOpen) {
      // Intentional sync: mount before the entry animation runs in next RAFs.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      setTransferSubmitted(false);
      // Desktop: QR tab default, Mobile: Bank app tab default
      const isMobile = window.innerWidth < 768;
      setActiveTab(isMobile ? "bank" : "qr");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    } else {
      setAnimate(false);
      const timeout = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Computed before the escape-key effect so the effect can list it as a dep.
  const showSuccess = paid || transferSubmitted;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showSuccess) onClose();
    };

    if (visible) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, onClose, showSuccess]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!visible || typeof window === "undefined") return null;

  const mobileSuccessModal = showSuccess ? (
    <PaymentSuccessView animate={animate} transferSubmitted={transferSubmitted} />
  ) : null;

  // Mobile drawer view — extracted to PaymentModalMobile.tsx
  // (see ./payment/PaymentModalMobile for the JSX; this object is the prop bag).
  const view: PaymentModalViewProps = {
    animate,
    onClose,
    showSuccess,
    activeTab,
    setActiveTab,
    paymentMethod,
    onLendMNSelect,
    onStorePaySelect,
    onTransferSelect,
    onQPayReselect,
    invoiceData,
    lendmnInvoiceData,
    storepayInvoiceData,
    totalAmount,
    orderItems,
    orderNumber,
    phoneNumber,
    hasInvoice,
    paid,
    checking,
    checkFailed,
    checkError,
    handleManualCheck,
    isCreating,
    createError,
    copiedField,
    handleCopy,
    transferSubmitted,
    setTransferSubmitted,
    onPaymentSuccess,
  };
  const mobileContent = <PaymentModalMobile view={view} />;

  // Desktop centered-modal view — extracted to PaymentModalDesktop.tsx
  const desktopContent = <PaymentModalDesktop view={view} />;

  return createPortal(
    <>
      {mobileSuccessModal}
      {mobileContent}
      {desktopContent}
    </>,
    document.body,
  );
}
