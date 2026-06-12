export type SideMenu =
  | "orders"
  | "address"
  | "phone"
  | "point"
  | "wishlist"
  | "coupon"
  | "personal"
  | "connections"
  | "settings"
  | "help"
  | "logout";

export function formatRegisteredDate(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export function getDisplayName(
  user: { first_name?: string | null; last_name?: string | null } | null,
): string {
  if (user?.first_name || user?.last_name) {
    return `${user.last_name ?? ""} ${user.first_name ?? ""}`.trim();
  }
  return "Нэр тохируулах";
}

export function getRegisteredLabel(createdAt: string | null | undefined): string | null {
  return createdAt ? `${formatRegisteredDate(createdAt)}-нд бүртгэгдсэн` : null;
}
