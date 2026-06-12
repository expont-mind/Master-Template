"use client";

import Link from "next/link";

import { PaymentModal, type OrderItemPayload } from "@/components/checkout/PaymentModal";
import { useCanReviewAny } from "@/lib/hooks/useReviews";
import { ROUTES } from "@/lib/utils/constants";
import { useWishlistStore } from "@/stores/wishlist-store";

import { calculateOrderPricing } from "./order/_orderPricing";
import { isUnpaidStatus, resolveOrderBadge } from "./order/_orderStatusResolver";
import { buildOrderSteps } from "./order/_orderSteps";
import { useOrderPayment } from "./order/_useOrderPayment";
import { useOrderPoints } from "./order/_useOrderPoints";
import { OrderAddressCard, OrderContactCard } from "./order/OrderAddressCard";
import { OrderDetailHeader } from "./order/OrderDetailHeader";
import { OrderItemsList } from "./order/OrderItemsList";
import { OrderPaymentWarning } from "./order/OrderPaymentWarning";
import { OrderPriceBreakdown } from "./order/OrderPriceBreakdown";
import { OrderTimeline } from "./order/OrderTimeline";

import type { ProfileOrder } from "@/app/profile/page";
import type { Database } from "@/types/database";

type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];

interface OrderDetailViewProps {
  order: ProfileOrder;
  addresses: AddressRow[];
  user: UserRow | null;
  onBack: () => void;
  onRequestDelete?: () => void;
}

function formatOrderNumber(order: ProfileOrder): string {
  return order.order_number ? `#${order.order_number}` : `#${order.id.slice(0, 8).toUpperCase()}`;
}

function buildOrderItemsPayload(items: ProfileOrder["items"]): OrderItemPayload[] {
  return items.map((item) => ({
    productId: item.product_id,
    name: item.products?.name ?? "Бүтээгдэхүүн",
    price: item.price,
    quantity: item.quantity,
    variantId: null,
    variantName: item.variant_name,
  }));
}

function findReviewableItem(
  order: ProfileOrder,
  reviewableProductId: string | null | undefined,
): ProfileOrder["items"][number] | null {
  if (order.delivery_status !== "delivered" || !reviewableProductId) {
    return null;
  }
  return (order.items ?? []).find((i) => i.product_id === reviewableProductId) ?? null;
}

interface ReviewLinkProps {
  href: string;
}

const ReviewLink = ({ href }: ReviewLinkProps) => (
  <div className="flex items-center justify-start pl-5 pt-4">
    <Link
      href={href}
      className="flex px-3 py-2.5 bg-text-primary rounded-md cursor-pointer text-white font-normal text-base font-manrope hover:bg-surface-dark transition-colors duration-200"
    >
      <span className="px-0.5">Үнэлгээ өгөх</span>
    </Link>
  </div>
);

export const OrderDetailView = ({
  order,
  addresses,
  user,
  onBack,
  onRequestDelete,
}: OrderDetailViewProps) => {
  const items = order.items ?? [];
  const isPaymentUnpaid = isUnpaidStatus(order.payment_status);
  const badge = resolveOrderBadge(order.payment_status, order.delivery_status);

  const userId = useWishlistStore((s) => s.userId);
  const productIds = items.map((item) => item.product_id);
  const { data: reviewableProductId } = useCanReviewAny(productIds, userId);
  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0] ?? null;

  const { pointsUsed, pointsEarned } = useOrderPoints(order.id);
  const payment = useOrderPayment(order.id);

  const pricing = calculateOrderPricing({
    order,
    isPaymentUnpaid,
    retryTotalAmount: payment.retryTotalAmount,
    pointsUsed,
  });

  const steps = buildOrderSteps(order);
  const nextStepIndex = steps.findIndex((s) => !s.completed);
  const orderItemsPayload = buildOrderItemsPayload(items);
  const reviewableItem = findReviewableItem(order, reviewableProductId);
  const reviewHref = reviewableItem
    ? ROUTES.PRODUCT(reviewableItem.products?.slug ?? reviewableItem.product_id)
    : null;

  return (
    <div className="flex flex-col gap-2">
      <OrderDetailHeader
        orderNumber={formatOrderNumber(order)}
        badge={badge}
        isPaymentUnpaid={isPaymentUnpaid}
        onRequestDelete={onRequestDelete}
        onBack={onBack}
      />

      <div className="flex flex-col gap-6 px-0.5">
        {isPaymentUnpaid && (
          <OrderPaymentWarning
            onPaymentClick={payment.handlePaymentClick}
            onRequestDelete={onRequestDelete}
          />
        )}

        {/* Timeline Steps */}
        <div className="flex flex-col gap-1.5 sm:gap-0 pb-4">
          <OrderTimeline steps={steps} nextStepIndex={nextStepIndex} />
          {reviewHref && <ReviewLink href={reviewHref} />}
        </div>

        {defaultAddress && <OrderAddressCard address={defaultAddress} />}
        {user && <OrderContactCard user={user} />}

        <OrderItemsList items={items} createdAt={order.created_at} />

        <div className="py-2">
          <div className="w-full h-px bg-border" />
        </div>

        <OrderPriceBreakdown
          pricing={pricing}
          pointsEarned={pointsEarned}
          couponCode={order.coupon_code}
          paymentWallet={order.payment_wallet}
        />
      </div>

      <PaymentModal
        isOpen={payment.isPaymentModalOpen}
        onClose={payment.closePaymentModal}
        totalAmount={payment.retryTotalAmount ?? order.total_amount}
        invoiceData={payment.invoiceData}
        lendmnInvoiceData={null}
        storepayInvoiceData={null}
        paymentMethod="qpay"
        isCreating={payment.isCreatingInvoice}
        createError={payment.createError}
        orderItems={orderItemsPayload}
        orderNumber={order.order_number}
        orderId={order.id}
        onPaymentSuccess={payment.handlePaymentSuccess}
      />
    </div>
  );
};
