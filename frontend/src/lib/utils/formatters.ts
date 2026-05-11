import { LOCALE } from "./brand-config";

// Price formatting
export function formatPrice(price: number, currency: string = " ₮"): string {
  return `${price.toLocaleString("mn-MN")}${currency}`;
}

// Discount percentage
export function getDiscountPercentage(
  price: number,
  discountPrice: number | null,
): number | null {
  if (!discountPrice || discountPrice >= price) return null;
  return Math.round(((price - discountPrice) / price) * 100);
}

// Ensure timestamp is parsed as UTC (Supabase TIMESTAMP columns may lack timezone suffix)
export function parseAsUTC(date: string | Date): Date {
  if (date instanceof Date) return date;
  if (/[Z+\-]\d{0,2}:?\d{0,2}$/.test(date)) return new Date(date);
  return new Date(date + "Z");
}

// Date formatting
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Ulaanbaatar",
  };
  return parseAsUTC(date).toLocaleDateString("mn-MN", {
    ...defaultOptions,
    ...options,
  });
}

// Relative time (e.g., "2 hours ago")
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = parseAsUTC(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Дөнгөж сая";
  if (diffMins < 60) return `${diffMins} минутын өмнө`;
  if (diffHours < 24) return `${diffHours} цагийн өмнө`;
  if (diffDays < 7) return `${diffDays} өдрийн өмнө`;
  return formatDate(date);
}

// Strip Mongolian country-code prefix from a phone string.
export function stripPhonePrefix(phone: string): string {
  return phone.replace(LOCALE.phoneRegex, "");
}

// Phone number formatting
export function formatPhone(phone: string): string {
  // Mongolian phone format: 9912-3456
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  return phone;
}

// Order number formatting
export function formatOrderNumber(orderNumber: string): string {
  return `#${orderNumber}`;
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

// Slug generation
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04FF]+/g, "-") // Keep Cyrillic characters
    .replace(/^-+|-+$/g, "");
}
