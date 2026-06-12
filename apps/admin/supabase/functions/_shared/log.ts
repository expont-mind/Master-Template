// Deno-compatible structured logger for Supabase Edge Functions.
//
// Mirrors @repo/logger (Node/Next.js) but is self-contained so it can be
// imported from Edge Functions via a relative path without going through npm.
//
// Edge Function logs flow into Supabase's dashboard → Logs → Edge Functions,
// where JSON payloads are searchable. Keep tags snake_case for filterability.

type LogContext = Record<string, unknown>;

function write(level: "info" | "warn" | "error", tag: string, context?: LogContext | unknown) {
  const payload: Record<string, unknown> = { level, tag };
  if (context && typeof context === "object" && !(context instanceof Error)) {
    payload.context = context;
  }

  if (level === "error") {
    console.error(payload, context instanceof Error ? context : undefined);
  } else if (level === "warn") {
    console.warn(payload);
  } else {
    console.log(payload);
  }
}

export const log = {
  info: (tag: string, context?: LogContext) => write("info", tag, context),
  warn: (tag: string, context?: LogContext | unknown) => write("warn", tag, context),
  error: (tag: string, context?: LogContext | unknown) => write("error", tag, context),
};

export type { LogContext };
