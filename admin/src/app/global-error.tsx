"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // global-error.tsx replaces the root layout when it renders, so
    // imports from `@/components/...` may not be available — keep this
    // file dependency-free.
    // eslint-disable-next-line no-console
    console.error("[global-error]", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: 32,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>
          Системийн алдаа
        </h1>
        <p style={{ color: "#64748b", marginBottom: 16 }}>
          Хүсэлтийг боловсруулах боломжгүй байна. Дахин оролдоно уу.
        </p>
        {error.digest ? (
          <p style={{ fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>
            Алдааны код: {error.digest}
          </p>
        ) : null}
        <button
          onClick={() => reset()}
          style={{
            marginTop: 16,
            padding: "8px 16px",
            background: "#0f172a",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Дахин оролдох
        </button>
      </body>
    </html>
  );
}
