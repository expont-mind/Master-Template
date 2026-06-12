// Shared types for the mobile and desktop payment modal views.
//
// PaymentModal orchestrates state + side effects; the two view components
// (PaymentModalMobile, PaymentModalDesktop) render UI given these props.

import type {
  LendMNInvoiceData,
  OrderItemPayload,
  PaymentMethod,
  StorePayInvoiceData,
} from "./types";
import type { QPayInvoiceData } from "@/lib/qpay/types";

export interface PaymentModalViewProps {
  // Layout / animation
  animate: boolean;
  onClose: () => void;
  showSuccess: boolean;

  // Tab state (qr vs bank)
  activeTab: "qr" | "bank";
  setActiveTab: (tab: "qr" | "bank") => void;

  // Provider selection callbacks
  paymentMethod: PaymentMethod;
  onLendMNSelect?: () => void;
  onStorePaySelect?: () => void;
  onTransferSelect?: () => void;
  onQPayReselect?: () => void;

  // Invoice data per provider
  invoiceData: QPayInvoiceData | null;
  lendmnInvoiceData: LendMNInvoiceData | null;
  storepayInvoiceData: StorePayInvoiceData | null;

  // Order + payer info
  totalAmount: number;
  orderItems: OrderItemPayload[];
  orderNumber: string | null;
  phoneNumber?: string;

  // Polling state
  hasInvoice: boolean;
  paid: boolean;
  checking: boolean;
  checkFailed: boolean;
  checkError: string | null;
  handleManualCheck: () => void;

  // Loading / error
  isCreating: boolean;
  createError: string | null;

  // Copy-to-clipboard helper
  copiedField: string | null;
  handleCopy: (text: string, field: string) => void;

  // Transfer flow
  transferSubmitted: boolean;
  setTransferSubmitted: (v: boolean) => void;
  onPaymentSuccess: () => void;
}

// Small inline spinner used in the manual "Check payment" button.
// Lives here so both PaymentModalMobile and PaymentModalDesktop can import it.
export function LoadingSpinner({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className="animate-spin">
      <path
        d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
