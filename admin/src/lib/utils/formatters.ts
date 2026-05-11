/**
 * Ensure a Supabase timestamp is parsed as UTC.
 *
 * Supabase TIMESTAMP (without time zone) columns return ISO strings
 * without a timezone suffix (e.g. "2024-01-15T06:00:00").
 * JavaScript's `new Date()` interprets those as local time, which
 * causes an 8-hour offset for Asia/Ulaanbaatar (UTC+8).
 *
 * This helper appends "Z" when the suffix is missing so the value
 * is correctly treated as UTC.
 */
export function parseAsUTC(ts: string): Date {
  if (/[Z+\-]\d{0,2}:?\d{0,2}$/.test(ts)) return new Date(ts);
  return new Date(ts + "Z");
}

/** Format relative time in Mongolian (short form for notification list) */
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
    return date.toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Ulaanbaatar",
    });
  }
}
