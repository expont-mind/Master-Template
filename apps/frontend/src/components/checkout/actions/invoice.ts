"use server";

import { createLendMNInvoice } from "@/lib/lendmn/client";
import { createInvoice } from "@/lib/qpay/client";
import { createStorePayInvoice } from "@/lib/storepay/client";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/utils/brand-config";
import { STOREPAY_MIN_AMOUNT } from "@/lib/utils/constants";
import { log } from "@/lib/utils/logger";

import {
  buildPendingOrderData,
  computeInvoiceTotals,
  createOrderWithItems,
  ensureCheckoutContext,
  mapStorePayError,
  prepareAdminWithValidation,
} from "./_invoice-helpers";
import { createInvoiceForExistingOrderFlow } from "./_retryInvoice";
import {
  generateOrderNumber,
  type CreateCheckoutInvoicePayload,
  type CreateLendMNCheckoutInvoicePayload,
  type CreateStorePayCheckoutInvoicePayload,
} from "./_shared";

import type { QPayInvoiceData } from "@/lib/qpay/types";

type QPayResult =
  | {
      success: true;
      data: { invoice: QPayInvoiceData; orderNumber: string; orderId: string };
    }
  | { success: false; error: string };

export async function createCheckoutInvoice(
  payload: CreateCheckoutInvoicePayload,
): Promise<QPayResult> {
  const ctx = await ensureCheckoutContext(payload);
  if (!ctx.ok) return ctx.failure;

  try {
    const setup = await prepareAdminWithValidation(ctx.user, payload.items);
    if (!setup.ok) return setup.failure;

    const totals = await computeInvoiceTotals(setup.admin, payload);
    const orderNumber = generateOrderNumber();

    const created = await createOrderWithItems({
      admin: setup.admin,
      user: ctx.user,
      orderNumber,
      paymentMethod: "qpay",
      payload,
      totals,
      logScope: "checkout_invoice",
    });
    if (!created.ok) return created.failure;

    const invoice = await createInvoice({
      amount: totals.finalTotal,
      description: `${BRAND.name} захиалга: ${orderNumber}`,
      customerName: `${payload.contact.lastName} ${payload.contact.firstName}`,
      callbackUrl:
        process.env.QPAY_CALLBACK_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/checkout/callback`,
    });

    const { error: insertError } = await setup.admin.from("payment_invoices").insert({
      id: invoice.id,
      user_id: ctx.user.id,
      amount: totals.finalTotal,
      status: "pending",
      order_number: orderNumber,
      order_id: created.orderId,
      pending_order_data: buildPendingOrderData(payload),
    });
    if (insertError) {
      log.error("checkout_invoice_insert_failed", insertError);
      await setup.admin.from("orders").delete().eq("id", created.orderId);
      return {
        success: false,
        error: "Төлбөрийн нэхэмжлэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.",
      };
    }

    return {
      success: true,
      data: { invoice, orderNumber, orderId: created.orderId },
    };
  } catch (err) {
    log.error("checkout_invoice_unexpected_error", err);
    return { success: false, error: "Нэхэмжлэл үүсгэхэд алдаа гарлаа" };
  }
}

type LendMNResult =
  | {
      success: true;
      data: {
        invoiceId: string;
        invoiceNumber: string;
        orderNumber: string;
        orderId: string;
      };
    }
  | { success: false; error: string };

export async function createLendMNCheckoutInvoice(
  payload: CreateLendMNCheckoutInvoicePayload,
): Promise<LendMNResult> {
  const ctx = await ensureCheckoutContext(payload);
  if (!ctx.ok) return ctx.failure;

  try {
    const setup = await prepareAdminWithValidation(ctx.user, payload.items);
    if (!setup.ok) return setup.failure;

    const totals = await computeInvoiceTotals(setup.admin, payload);
    const orderNumber = generateOrderNumber();

    const created = await createOrderWithItems({
      admin: setup.admin,
      user: ctx.user,
      orderNumber,
      paymentMethod: "lendmn",
      payload,
      totals,
      logScope: "lendmn_invoice",
    });
    if (!created.ok) return created.failure;

    const result = await createLendMNInvoice({
      amount: totals.finalTotal,
      description: `${BRAND.name} захиалга: ${orderNumber}`,
      phoneNumber: payload.phoneNumber,
      orderNumber,
      userId: ctx.user.id,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/checkout/lendmn-callback`,
      pendingOrderData: { items: payload.items, address: payload.address ?? null },
      orderId: created.orderId,
    });

    return {
      success: true,
      data: {
        invoiceId: result.invoiceId,
        invoiceNumber: result.invoiceNumber,
        orderNumber: result.orderNumber,
        orderId: created.orderId,
      },
    };
  } catch (err) {
    log.error("lendmn_invoice_unexpected_error", err);
    return { success: false, error: "LendMN нэхэмжлэл үүсгэхэд алдаа гарлаа" };
  }
}

type StorePayResult =
  | {
      success: true;
      data: {
        invoiceId: string;
        loanId: number;
        orderNumber: string;
        orderId: string;
      };
    }
  | { success: false; error: string };

export async function createStorePayCheckoutInvoice(
  payload: CreateStorePayCheckoutInvoicePayload,
): Promise<StorePayResult> {
  const ctx = await ensureCheckoutContext(payload);
  if (!ctx.ok) return ctx.failure;

  try {
    const setup = await prepareAdminWithValidation(ctx.user, payload.items);
    if (!setup.ok) return setup.failure;

    const totals = await computeInvoiceTotals(setup.admin, payload);

    if (totals.finalTotal < STOREPAY_MIN_AMOUNT) {
      return {
        success: false,
        error: `StorePay хуваарь төлөлт ${STOREPAY_MIN_AMOUNT.toLocaleString()}₮-с дээш дүнд боломжтой`,
      };
    }

    const orderNumber = generateOrderNumber();

    const created = await createOrderWithItems({
      admin: setup.admin,
      user: ctx.user,
      orderNumber,
      paymentMethod: "storepay",
      payload,
      totals,
      logScope: "storepay_invoice",
    });
    if (!created.ok) return created.failure;

    const result = await createStorePayInvoice({
      amount: totals.finalTotal,
      description: `${BRAND.name} захиалга: ${orderNumber}`,
      mobileNumber: payload.phoneNumber,
      orderNumber,
      userId: ctx.user.id,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/checkout/storepay-callback`,
      pendingOrderData: { items: payload.items, address: payload.address ?? null },
      orderId: created.orderId,
    });

    return {
      success: true,
      data: {
        invoiceId: result.invoiceId,
        loanId: result.loanId,
        orderNumber: result.orderNumber,
        orderId: created.orderId,
      },
    };
  } catch (err) {
    log.error("storepay_invoice_unexpected_error", err);
    return { success: false, error: mapStorePayError(err) };
  }
}

interface CreateInvoiceForOrderResult {
  success: boolean;
  data?: {
    invoice: QPayInvoiceData;
    orderNumber: string;
    orderId: string;
    totalAmount: number;
  };
  error?: string;
}

/**
 * Re-validate an existing pending order and produce a fresh QPay invoice
 * for it. Used when a user returns to pay an order that previously failed
 * or was abandoned. Strips any prior coupon/point discounts — the user
 * must pay full price on retry.
 */
export async function createInvoiceForExistingOrder(
  orderId: string,
): Promise<CreateInvoiceForOrderResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Нэвтэрч орно уу" };

  return createInvoiceForExistingOrderFlow(orderId, user.id);
}
