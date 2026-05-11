"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";

const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  identity_already_exists: {
    title: "Холболтын алдаа",
    message:
      "Энэ нийгмийн сүлжээний бүртгэл өөр хаягтай холбогдсон байна. Өөр бүртгэлээр нэвтэрнэ үү.",
  },
  access_denied: {
    title: "Хандалт хориглогдсон",
    message: "Нэвтрэх эрх олгогдсонгүй. Дахин оролдоно уу.",
  },
  server_error: {
    title: "Серверийн алдаа",
    message: "Түр хүлээгээд дахин оролдоно уу.",
  },
  unauthorized_client: {
    title: "Зөвшөөрөлгүй",
    message: "Нэвтрэх эрх олгогдсонгүй.",
  },
  invalid_request: {
    title: "Алдаатай хүсэлт",
    message: "Нэвтрэх хүсэлт алдаатай байна.",
  },
};

function parseHashParams(hash: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!hash || hash.length < 2) return params;

  const queryString = hash.startsWith("#") ? hash.slice(1) : hash;
  const pairs = queryString.split("&");

  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, " "));
    }
  }

  return params;
}

export function AuthErrorHandler() {
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = parseHashParams(hash);
    const errorCode = params.error_code;
    const error = params.error;

    if (error || errorCode) {
      const errorInfo =
        ERROR_MESSAGES[errorCode] ||
        ERROR_MESSAGES[error] ||
        {
          title: "Нэвтрэх алдаа",
          message: params.error_description || "Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.",
        };

      addToast({
        type: "error",
        title: errorInfo.title,
        message: errorInfo.message,
        duration: 8000,
      });

      // Clear the hash from URL without page reload
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [addToast]);

  return null;
}
