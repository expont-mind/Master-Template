import { parseAsUTC } from "@/lib/utils/formatters";

// Format relative time in Mongolian (short form for notification list)
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = parseAsUTC(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "Дөнгөж сая";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} мин`;
  } else if (diffHours < 24) {
    return `${diffHours} цаг`;
  } else if (diffDays < 7) {
    return `${diffDays} өдөр`;
  } else {
    // Format as date for older notifications
    return date.toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Ulaanbaatar",
    });
  }
}

// Format order date as "YYYY.MM.DD"
export function formatOrderDate(dateString: string): string {
  const date = parseAsUTC(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Ulaanbaatar",
  };
  const formatted = date.toLocaleDateString("en-CA", options); // en-CA gives YYYY-MM-DD format
  return formatted.replace(/-/g, ".");
}

// Format price with thousand separators and currency
export function formatPrice(amount: number): string {
  return `${amount.toLocaleString("mn-MN")} ₮`;
}

// Get short order ID (first 8 characters, uppercase)
export function getShortOrderId(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}
