import { parseAsUTC } from "@/lib/utils/formatters";

const WALLET_COLORS: Record<string, string> = {
  socialpay: "bg-green-50 text-green-600",
  monpay: "bg-orange-50 text-orange-600",
  most: "bg-blue-50 text-blue-600",
  hipay: "bg-red-50 text-red-600",
  "m bank": "bg-purple-50 text-purple-600",
  хаан: "bg-emerald-50 text-emerald-600",
  голомт: "bg-sky-50 text-sky-600",
  "худалдаа хөгжлийн": "bg-amber-50 text-amber-600",
  хас: "bg-teal-50 text-teal-600",
  төрийн: "bg-indigo-50 text-indigo-600",
  капитрон: "bg-pink-50 text-pink-600",
};

const WALLET_SHORT_NAMES: Record<string, string> = {
  "худалдаа хөгжлийн банк": "Худалдаа хөгжил",
};

export function getWalletColor(wallet: string): string {
  const key = wallet.toLowerCase();
  if (WALLET_COLORS[key]) return WALLET_COLORS[key];
  for (const [k, v] of Object.entries(WALLET_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-blue-50 text-blue-600";
}

export function formatWalletName(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower === "p2p") return "Данс";
  if (WALLET_SHORT_NAMES[lower]) return WALLET_SHORT_NAMES[lower];
  if (lower === "м банк" || lower === "m bank") return raw;
  return raw.replace(/\s*банк\s*/gi, "").trim() || raw;
}

export function formatDate(dateString: string): string {
  const date = parseAsUTC(dateString);
  const datePart = date
    .toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Ulaanbaatar",
    })
    .replace(/-/g, "/");
  const timePart = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ulaanbaatar",
  });
  return `${datePart} ${timePart}`;
}

export function formatPrice(amount: number): string {
  return `${amount.toLocaleString()}₮`;
}
