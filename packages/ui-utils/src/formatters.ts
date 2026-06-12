import { LOCALE } from "@repo/config-brand";

// Price formatting (locale-aware). Default currency suffix is the brand's locale.
export function formatPrice(price: number, currency: string = ` ${LOCALE.currencySymbol}`): string {
  return `${price.toLocaleString(LOCALE.code)}${currency}`;
}

// Discount percentage (rounded). Returns null when there is no real discount.
export function getDiscountPercentage(price: number, discountPrice: number | null): number | null {
  if (!discountPrice || discountPrice >= price) return null;
  return Math.round(((price - discountPrice) / price) * 100);
}

// Detect animated image formats that Next.js Image cannot optimize. Sniffing
// by file extension is sufficient — our admin upload pipeline preserves the
// original extension in the Supabase Storage URL. Use to set `unoptimized`
// on `<Image>` so the loader skips the optimization (which would time out
// trying to process every GIF frame).
export function isAnimatedImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const pathname = url.split("?")[0].toLowerCase();
  return pathname.endsWith(".gif") || pathname.endsWith(".apng");
}

// Ensure a Supabase timestamp is parsed as UTC.
// Supabase TIMESTAMP (without time zone) columns return ISO strings without a
// timezone suffix. JS `new Date()` interprets those as local time, which
// causes an 8-hour offset for Asia/Ulaanbaatar (UTC+8).
export function parseAsUTC(date: string | Date): Date {
  if (date instanceof Date) return date;
  if (/[Z+\-]\d{0,2}:?\d{0,2}$/.test(date)) return new Date(date);
  return new Date(`${date}Z`);
}

// Locale-aware date formatting (uses brand locale + timezone by default).
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: LOCALE.timezone,
  };
  return parseAsUTC(date).toLocaleDateString(LOCALE.code, { ...defaultOptions, ...options });
}

// Relative time (long form, frontend default): "2 минутын өмнө"
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

// Relative time (short form, admin notification list default): "2 мин"
export function formatRelativeTimeShort(date: string | Date): string {
  const now = new Date();
  const then = parseAsUTC(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Дөнгөж сая";
  if (diffMins < 60) return `${diffMins} мин`;
  if (diffHours < 24) return `${diffHours} цаг`;
  if (diffDays < 7) return `${diffDays} өдөр`;
  return formatDate(date);
}

// Strip the brand locale's country-code prefix from a phone string.
export function stripPhonePrefix(phone: string): string {
  return phone.replace(LOCALE.phoneRegex, "");
}

// Mongolian phone format: XXXX-XXXX (returns input unchanged if not 8 digits).
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 8) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  return phone;
}

// Build an E.164 number (+<countryCode><digits>) from local digits or any
// already-prefixed variant. The single canonical builder — auth flows must
// use this instead of hand-concatenating the country code.
export function formatPhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith(LOCALE.phoneCountryCode)) return `+${digits}`;
  return `+${LOCALE.phoneCountryCode}${digits}`;
}

// Order numbers are displayed with a leading hash.
export function formatOrderNumber(orderNumber: string): string {
  return `#${orderNumber}`;
}

// Truncate text to a maximum length, appending ellipsis when truncated.
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

// URL-safe slug generator. Preserves Cyrillic characters (U+0400–U+04FF).
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9Ѐ-ӿ]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
