// Structured logger facade.
//
// Today this is a thin wrapper around `console`. When a telemetry backend
// (Sentry, Axiom, Vercel Observability) is wired up, this is the single file
// that changes — call sites keep the same API.
//
// Keep tags machine-readable (`snake_case`) so log scrapers can aggregate
// without regex gymnastics. Structured `context` lets downstream systems
// index by field instead of parsing strings.

type LogContext = Record<string, unknown>;

/* eslint-disable no-console -- single allowed sink; all call sites go through
   write() below so console isn't called elsewhere. */
function write(level: "info" | "warn" | "error", tag: string, context?: LogContext | unknown) {
  const payload = {
    level,
    tag,
    ...(context && typeof context === "object" && !(context instanceof Error) ? { context } : {}),
  };

  if (level === "error") {
    console.error(payload, context instanceof Error ? context : undefined);
  } else if (level === "warn") {
    console.warn(payload);
  } else {
    console.info(payload);
  }
}
/* eslint-enable no-console */

export const log = {
  info: (tag: string, context?: LogContext) => write("info", tag, context),
  warn: (tag: string, context?: LogContext | unknown) => write("warn", tag, context),
  error: (tag: string, context?: LogContext | unknown) => write("error", tag, context),
};

export type { LogContext };
