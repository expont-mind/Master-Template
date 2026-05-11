import type { AdminRole } from "./database";

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  permissions: string[];
}

export interface AdminSession {
  user: AdminUser | null;
  isLoading: boolean;
  error: string | null;
}

// Role hierarchy and permissions
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: [
    "admin:manage",
    "products:read",
    "products:write",
    "products:delete",
    "orders:read",
    "orders:write",
    "orders:cancel",
    "users:read",
    "users:write",
    "users:ban",
    "payments:read",
    "payments:refund",
    "content:read",
    "content:write",
    "content:delete",
    "reports:read",
    "reports:export",
    "settings:read",
    "settings:write",
    "audit:read",
  ],
  operator: [
    "products:read",
    "products:write",
    "orders:read",
    "orders:write",
    "orders:cancel",
    "users:read",
    "payments:read",
    "reports:read",
  ],
  content_manager: [
    "products:read",
    "content:read",
    "content:write",
    "content:delete",
    "reports:read",
  ],
  support: [
    "orders:read",
    "users:read",
    "payments:read",
  ],
};

export function hasPermission(
  role: AdminRole | undefined,
  permission: string
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

export function hasAnyPermission(
  role: AdminRole | undefined,
  permissions: string[]
): boolean {
  if (!role) return false;
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(
  role: AdminRole | undefined,
  permissions: string[]
): boolean {
  if (!role) return false;
  return permissions.every((p) => hasPermission(role, p));
}
