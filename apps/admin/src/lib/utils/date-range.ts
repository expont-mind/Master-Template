/** Shared date-range utilities for Dashboard & Analytics (Asia/Ulaanbaatar = UTC+8) */

// Mongolia does not observe DST — UTC+8 is stable year-round.
const UB_OFFSET_MS = 8 * 60 * 60 * 1000;

/** Get the current date/time as perceived in Ulaanbaatar. */
export function getUBDate(date: Date = new Date()): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Ulaanbaatar" }));
}

/** Get the UTC timestamp corresponding to start-of-day in Ulaanbaatar. */
export function getUBDayStart(date: Date = new Date()): Date {
  const ub = getUBDate(date);
  return new Date(Date.UTC(ub.getFullYear(), ub.getMonth(), ub.getDate()) - UB_OFFSET_MS);
}

/** Get today's start-of-day (UB time) as an ISO string — used for "today" queries. */
export function getUBTodayStartISO(): string {
  return getUBDayStart().toISOString();
}

export const MONGOLIAN_MONTHS = [
  "1-р сар",
  "2-р сар",
  "3-р сар",
  "4-р сар",
  "5-р сар",
  "6-р сар",
  "7-р сар",
  "8-р сар",
  "9-р сар",
  "10-р сар",
  "11-р сар",
  "12-р сар",
];

/** Parse "YYYY-MM" into { from, to } Date range adjusted for UB (UTC+8).
 *  `from` = start of month, `to` = start of next month (exclusive). */
export function parseMonthRange(month: string | null): { from: Date; to: Date } | null {
  if (!month) return null;
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const mon = parseInt(match[2], 10); // 1-based
  if (mon < 1 || mon > 12) return null;

  return {
    from: new Date(Date.UTC(year, mon - 1, 1) - UB_OFFSET_MS),
    to: new Date(Date.UTC(year, mon, 1) - UB_OFFSET_MS),
  };
}

/** Generate last 12 month options in Ulaanbaatar timezone. */
export function getMonthOptions(): { value: string; label: string }[] {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ulaanbaatar" }));
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based

  const options: { value: string; label: string }[] = [];

  for (let i = 0; i < 12; i++) {
    let month = currentMonth - i;
    let year = currentYear;
    if (month < 0) {
      month += 12;
      year -= 1;
    }
    const value = `${year}-${String(month + 1).padStart(2, "0")}`;
    const label = `${year} оны ${MONGOLIAN_MONTHS[month]}`;
    options.push({ value, label });
  }

  return options;
}

/** Get current month string in "YYYY-MM" format (Ulaanbaatar timezone). */
export function getCurrentMonth(): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ulaanbaatar" }));
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Get display label for a "YYYY-MM" month string. */
export function getMonthLabel(month: string): string | null {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const [, y, m] = match;
  return `${y} оны ${MONGOLIAN_MONTHS[parseInt(m, 10) - 1]}`;
}

/** Parse a custom date range from ISO strings into UB-timezone-aware Dates.
 *  Sets `from` to start of day and `to` to end of day in UB time. */
export function parseDateRange(fromStr: string, toStr: string): { from: Date; to: Date } | null {
  const from = new Date(fromStr);
  const to = new Date(toStr);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return null;

  // Align to UB day boundaries
  const fromUB = new Date(from.getTime() + UB_OFFSET_MS);
  const toUB = new Date(to.getTime() + UB_OFFSET_MS);

  const fromStart = new Date(
    Date.UTC(fromUB.getUTCFullYear(), fromUB.getUTCMonth(), fromUB.getUTCDate()) - UB_OFFSET_MS,
  );
  // to = start of NEXT day (exclusive)
  const toEnd = new Date(
    Date.UTC(toUB.getUTCFullYear(), toUB.getUTCMonth(), toUB.getUTCDate() + 1) - UB_OFFSET_MS,
  );

  return { from: fromStart, to: toEnd };
}
