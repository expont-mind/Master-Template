// Date formatting helpers for order display.
// Kept separate so they're independently testable / replaceable.

import { parseAsUTC } from "@/lib/utils/formatters";

export function formatDateTime(dateStr: string): string {
  const d = parseAsUTC(dateStr);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Ulaanbaatar",
  });
  const parts = formatter.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}/${get("month")}/${get("day")}  ${get("hour")}:${get("minute")}:${get("second")}`;
}

export function formatDateShort(dateStr: string): string {
  const d = parseAsUTC(dateStr);
  return d
    .toLocaleDateString("en-CA", { timeZone: "Asia/Ulaanbaatar" })
    .replace(/-/g, ".");
}
