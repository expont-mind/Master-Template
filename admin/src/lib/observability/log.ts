/**
 * Logger facade.
 *
 * Today this is a thin wrapper around `console`. When a telemetry
 * backend (Sentry, Axiom, Vercel Observability) is wired up, this is
 * the single file that changes — all call sites keep the same API.
 *
 * Keep messages machine-readable (`snake_case` tags + structured
 * context) so log scrapers can aggregate without regex gymnastics.
 */

type LogContext = Record<string, unknown>;

function write(
  level: "info" | "warn" | "error",
  tag: string,
  context?: LogContext | unknown,
) {
  const payload = {
    level,
    tag,
    ...(context && typeof context === "object" && !(context instanceof Error)
      ? { context }
      : {}),
  };

  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(payload, context instanceof Error ? context : undefined);
  } else if (level === "warn") {
    // eslint-disable-next-line no-console
    console.warn(payload);
  } else {
    // eslint-disable-next-line no-console
    console.info(payload);
  }
}

export const log = {
  info: (tag: string, context?: LogContext) => write("info", tag, context),
  warn: (tag: string, context?: LogContext | unknown) =>
    write("warn", tag, context),
  error: (tag: string, context?: LogContext | unknown) =>
    write("error", tag, context),
};
