"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { checkPaymentStatus, createOrderAfterPayment } from "@/components/checkout/actions";
import { log } from "@/lib/utils/logger";

import {
  resolveCurrentInvoiceId,
  resolveHasInvoice,
  resolveProviderForCheck,
} from "./_paymentInvoiceSelectors";
import { useOrderPaymentRealtime } from "./_useOrderRealtime";

import type {
  LendMNInvoiceData,
  OrderItemPayload,
  PaymentMethod,
  StorePayInvoiceData,
} from "./types";
import type { QPayInvoiceData } from "@/lib/qpay/types";

interface UsePaymentPollingOptions {
  isOpen: boolean;
  paymentMethod: PaymentMethod;
  invoiceData: QPayInvoiceData | null;
  lendmnInvoiceData: LendMNInvoiceData | null;
  storepayInvoiceData: StorePayInvoiceData | null;
  orderId: string | null;
  orderItems: OrderItemPayload[];
  totalAmount: number;
  couponId?: string | null;
  couponDiscount?: number;
  pointsUsed?: number;
  pointDiscount?: number;
  onPaymentSuccess: () => void;
}

interface UsePaymentPollingResult {
  /** Resolved invoice id for the current payment method. */
  currentInvoiceId: string | undefined;
  /** True if there is an invoice available for the current payment method. */
  hasInvoice: boolean;
  /** True once the payment has been confirmed. */
  paid: boolean;
  /** Manual re-check trigger (Reload button). */
  manualCheck: () => Promise<void>;
  /** Whether a manual check is in flight. */
  checking: boolean;
  /** Whether the last manual check failed (still unpaid). */
  checkFailed: boolean;
  /** Optional error message from the last manual check. */
  checkError: string | null;
  /** Reset polling state when the modal is reopened. */
  reset: () => void;
}

/**
 * Encapsulates the payment-modal polling state machine:
 * - Selects the active invoice id based on paymentMethod.
 * - Polls `checkPaymentStatus` every 5s while the modal is open and
 *   the payment is unconfirmed (skipped for "transfer" — manual only).
 * - Subscribes to realtime updates on the order row in case the admin
 *   manually marks it paid.
 * - Calls `createOrderAfterPayment` exactly once on first confirmation
 *   (guarded by `orderCreatedRef`). The server action is itself
 *   idempotent, but the ref prevents redundant network calls.
 */
export function usePaymentPolling({
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
}: UsePaymentPollingOptions): UsePaymentPollingResult {
  const [paid, setPaid] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const orderCreatedRef = useRef(false);
  // Tracks whether the parent is still mounted. Polling can resolve
  // after the user navigates away; without this, state updates fire on
  // an unmounted component (React 19 warning + wasted work).
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const currentInvoiceId = resolveCurrentInvoiceId({
    paymentMethod,
    invoiceData,
    lendmnInvoiceData,
    storepayInvoiceData,
  });
  const hasInvoice = resolveHasInvoice({
    paymentMethod,
    invoiceData,
    lendmnInvoiceData,
    storepayInvoiceData,
  });
  const providerForCheck = resolveProviderForCheck(paymentMethod);

  const handlePaymentConfirmed = useCallback(async () => {
    if (orderCreatedRef.current) return;
    orderCreatedRef.current = true;

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    try {
      await createOrderAfterPayment({
        invoiceId: currentInvoiceId!,
        items: orderItems,
        total: totalAmount,
        couponId: couponId ?? null,
        couponDiscount: couponDiscount ?? 0,
        pointsUsed: pointsUsed ?? 0,
        pointDiscount: pointDiscount ?? 0,
      });
    } catch (err) {
      // Payment IS confirmed — callback will create the order server-side
      log.error("payment_confirmed_order_creation_failed", err);
    }

    setPaid(true);
    onPaymentSuccess();
  }, [
    currentInvoiceId,
    orderItems,
    totalAmount,
    couponId,
    couponDiscount,
    pointsUsed,
    pointDiscount,
    onPaymentSuccess,
  ]);

  const pollPayment = useCallback(async () => {
    // Belt-and-suspenders: orderCreatedRef is set the first time
    // payment is confirmed via either polling or the realtime channel,
    // so we never double-fire handlePaymentConfirmed even if both
    // sources race.
    if (!currentInvoiceId || paid || orderCreatedRef.current) return;

    const result = await checkPaymentStatus(currentInvoiceId, providerForCheck);
    if (!mountedRef.current || orderCreatedRef.current) return;
    if (result.success && result.paid) {
      await handlePaymentConfirmed();
    }
  }, [currentInvoiceId, paid, providerForCheck, handlePaymentConfirmed]);

  useEffect(() => {
    // Don't start (or restart) polling once payment is confirmed.
    if (!hasInvoice || paid || paymentMethod === "transfer") {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }
    pollingRef.current = setInterval(pollPayment, 5000);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [hasInvoice, paid, paymentMethod, pollPayment]);

  useOrderPaymentRealtime(orderId, paid, handlePaymentConfirmed);

  const manualCheck = useCallback(async () => {
    if (!currentInvoiceId || checking) return;
    setChecking(true);
    setCheckFailed(false);
    setCheckError(null);
    try {
      const result = await checkPaymentStatus(currentInvoiceId, providerForCheck);
      if (result.success && result.paid) {
        await handlePaymentConfirmed();
      } else if (!result.success) {
        setCheckFailed(true);
        setCheckError(result.error);
      } else {
        setCheckFailed(true);
      }
    } finally {
      setChecking(false);
    }
  }, [currentInvoiceId, checking, providerForCheck, handlePaymentConfirmed]);

  const reset = useCallback(() => {
    setPaid(false);
    setCheckFailed(false);
    setCheckError(null);
    orderCreatedRef.current = false;
  }, []);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset polling state each time the payment modal reopens
      reset();
    }
  }, [isOpen, reset]);

  return {
    currentInvoiceId,
    hasInvoice,
    paid,
    manualCheck,
    checking,
    checkFailed,
    checkError,
    reset,
  };
}
