import type { OrderWithUser } from "./types";

/**
 * Client-side sort to guarantee order matches the list page.
 * Parses orderBy strings like "paid_at.desc.nullslast,created_at.desc"
 */
export function sortOrdersClientSide(orders: OrderWithUser[], orderBy: string): OrderWithUser[] {
  const clauses = orderBy.split(",").map((clause) => {
    const parts = clause.trim().split(".");
    return {
      column: parts[0] as keyof OrderWithUser,
      ascending: !parts.includes("desc"),
      nullsLast: parts.includes("nullslast"),
    };
  });

  return [...orders].sort((a, b) => {
    for (const { column, ascending, nullsLast } of clauses) {
      const aVal = a[column];
      const bVal = b[column];

      if (aVal == null && bVal == null) continue;
      if (aVal == null) return nullsLast ? 1 : -1;
      if (bVal == null) return nullsLast ? -1 : 1;

      let cmp = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }

      if (cmp !== 0) return ascending ? cmp : -cmp;
    }
    return 0;
  });
}
