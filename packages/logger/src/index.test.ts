// Tests for the structured logger facade.
//
// We capture console output via Vitest's spy so we can assert on the payload
// shape. The logger is intentionally a thin wrapper today — these tests
// pin the public contract so future swaps (Sentry/Axiom) don't accidentally
// change what call sites see.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { log } from "./index";

describe("log facade", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits info with level + tag + context", () => {
    log.info("order_created", { orderId: "abc" });
    expect(infoSpy).toHaveBeenCalledWith({
      level: "info",
      tag: "order_created",
      context: { orderId: "abc" },
    });
  });

  it("emits info without a context object", () => {
    log.info("user_logged_in");
    expect(infoSpy).toHaveBeenCalledWith({ level: "info", tag: "user_logged_in" });
  });

  it("emits warn with structured payload", () => {
    log.warn("slow_query", { ms: 8000 });
    expect(warnSpy).toHaveBeenCalledWith({
      level: "warn",
      tag: "slow_query",
      context: { ms: 8000 },
    });
  });

  it("emits error with the structured payload and the original Error object", () => {
    const err = new Error("boom");
    log.error("payment_failed", err);
    expect(errorSpy).toHaveBeenCalledWith({ level: "error", tag: "payment_failed" }, err);
  });

  it("treats plain-object error context as a context field", () => {
    log.error("rpc_failed", { code: 500 });
    expect(errorSpy).toHaveBeenCalledWith(
      { level: "error", tag: "rpc_failed", context: { code: 500 } },
      undefined,
    );
  });
});
