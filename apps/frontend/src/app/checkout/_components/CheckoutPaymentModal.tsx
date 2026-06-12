"use client";

import { PaymentModal } from "@/components/checkout/PaymentModal";

import type { usePaymentFlow } from "@/app/checkout/_hooks/usePaymentFlow";
import type { OrderItemPayload } from "@/components/checkout/actions/_shared";
import type { SelectedCoupon } from "@/stores/cart-store";

type PaymentFlowState = ReturnType<typeof usePaymentFlow>;

interface CheckoutPaymentModalProps {
  payment: PaymentFlowState;
  totalPayable: number;
  orderItemsPayload: OrderItemPayload[];
  phone1: string;
  selectedCoupon: SelectedCoupon | null;
  couponDiscount: number;
  pointDiscount: number;
}

export function CheckoutPaymentModal({
  payment,
  totalPayable,
  orderItemsPayload,
  phone1,
  selectedCoupon,
  couponDiscount,
  pointDiscount,
}: CheckoutPaymentModalProps) {
  return (
    <PaymentModal
      isOpen={payment.showPaymentModal}
      onClose={payment.closePaymentModal}
      totalAmount={totalPayable}
      invoiceData={payment.invoiceData}
      lendmnInvoiceData={payment.lendmnInvoiceData}
      storepayInvoiceData={payment.storepayInvoiceData}
      paymentMethod={payment.paymentMethod}
      isCreating={payment.isCreatingInvoice}
      createError={payment.invoiceError}
      orderItems={orderItemsPayload}
      orderNumber={payment.orderNumber}
      orderId={payment.orderId}
      phoneNumber={phone1}
      couponId={selectedCoupon?.coupon_id ?? null}
      couponDiscount={couponDiscount}
      pointsUsed={pointDiscount}
      pointDiscount={pointDiscount}
      onPaymentSuccess={payment.handlePaymentSuccess}
      onLendMNSelect={payment.selectLendMN}
      onStorePaySelect={payment.selectStorePay}
      onTransferSelect={payment.selectTransfer}
      onQPayReselect={payment.reselectQPay}
    />
  );
}
