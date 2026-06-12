export type PointFilter = "all" | "activated" | "not_activated";
export type StatusFilter = "all" | "active" | "inactive" | "banned";

export interface FilteredUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  primary_phone: string | null;
}

export const POINT_FILTER_LABEL: Record<PointFilter, string> = {
  all: "Бүгд",
  activated: "Point идэвхтэй",
  not_activated: "Point идэвхжүүлээгүй",
};

export const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  all: "Бүгд",
  active: "Идэвхтэй",
  inactive: "Идэвхгүй",
  banned: "Хориглосон",
};

export function buildFilters(
  pointFilter: PointFilter,
  statusFilter: StatusFilter,
): Record<string, string> {
  const filters: Record<string, string> = {};

  if (pointFilter === "activated") {
    filters["point_activated_at.is"] = "not.null";
  } else if (pointFilter === "not_activated") {
    filters["point_activated_at.is"] = "null";
  }

  if (statusFilter !== "all") {
    filters["status.eq"] = statusFilter;
  }

  return filters;
}

export function getUserName(user: FilteredUser): string {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return name || user.email;
}
