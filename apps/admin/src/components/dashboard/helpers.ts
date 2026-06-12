import { parseAsUTC } from "@/lib/utils/formatters";

export function getFullName(
  user: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null,
): string {
  if (!user) return "Хэрэглэгч байхгүй";
  const parts = [user.first_name, user.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : user.email;
}

export function formatDate(dateString: string): string {
  return parseAsUTC(dateString).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Ulaanbaatar",
  });
}

export function getProductImage(
  product: { product_images: { url: string; is_primary: boolean }[] } | null,
): string | null {
  if (!product?.product_images?.length) return null;
  const primary = product.product_images.find((img) => img.is_primary);
  return primary?.url || product.product_images[0]?.url || null;
}

export function getTodayDateMN(): string {
  return new Date().toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Ulaanbaatar",
  });
}
