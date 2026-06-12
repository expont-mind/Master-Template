// Shared types and synchronous helpers for checkout actions.
// This file has NO `"use server"` directive — it exports types and pure
// functions, which server-action files cannot.

export interface OrderItemPayload {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variantId?: string | null;
  variantName?: string | null;
}

export interface DeliveryAddressPayload {
  city: string;
  district: string;
  sub_district: string;
  detail: string;
}

export interface ContactPayload {
  firstName: string;
  lastName: string;
  phone1: string;
  phone2: string;
}

export interface CreateCheckoutInvoicePayload {
  total: number;
  couponId?: string | null;
  couponDiscount?: number;
  pointsUsed?: number;
  pointDiscount?: number;
  contact: {
    firstName: string;
    lastName: string;
  };
  items: OrderItemPayload[];
  address: DeliveryAddressPayload;
}

export interface CreateLendMNCheckoutInvoicePayload {
  total: number;
  couponId?: string | null;
  couponDiscount?: number;
  pointsUsed?: number;
  pointDiscount?: number;
  contact: {
    firstName: string;
    lastName: string;
  };
  phoneNumber: string;
  items: OrderItemPayload[];
  address: DeliveryAddressPayload;
}

export interface CreateStorePayCheckoutInvoicePayload {
  total: number;
  couponId?: string | null;
  couponDiscount?: number;
  contact: {
    firstName: string;
    lastName: string;
  };
  phoneNumber: string;
  items: OrderItemPayload[];
  address: DeliveryAddressPayload;
}

export interface CreateOrderPayload {
  invoiceId: string;
  items: OrderItemPayload[];
  total: number;
  couponId?: string | null;
  couponDiscount?: number;
  pointsUsed?: number;
  pointDiscount?: number;
}

/**
 * Generate a random alphanumeric order number (e.g., "W5F041J6").
 *
 * Uses crypto.getRandomValues for the random portion so two requests
 * within the same millisecond can't collide on a Math.random() seed.
 * Format: 4-char base36 timestamp (least-significant ms bits) + 4 chars
 * from a 32-byte cryptographic random pool.
 */
export function generateOrderNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(bytes[i] % chars.length);
  }
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  return ts + result;
}

export function validateAddress(
  address: DeliveryAddressPayload | undefined,
): { valid: true } | { valid: false; error: string } {
  if (!address) {
    return { valid: false, error: "Хүргэлтийн хаяг оруулна уу" };
  }
  if (!address.city?.trim()) {
    return { valid: false, error: "Хот/Аймаг сонгоно уу" };
  }
  if (!address.district?.trim()) {
    return { valid: false, error: "Дүүрэг/Сум сонгоно уу" };
  }
  if (!address.sub_district?.trim()) {
    return { valid: false, error: "Хороо/Баг сонгоно уу" };
  }
  if (!address.detail?.trim()) {
    return { valid: false, error: "Дэлгэрэнгүй хаяг оруулна уу" };
  }
  return { valid: true };
}
