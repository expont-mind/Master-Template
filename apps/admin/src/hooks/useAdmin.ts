"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { hasPermission, hasAnyPermission, ROLE_PERMISSIONS } from "@/types/admin";

import type { AdminRole } from "@/types/database";

interface AdminState {
  id: string | null;
  email: string | null;
  role: AdminRole | null;
  isLoading: boolean;
  error: string | null;
}

export function useAdmin() {
  const [state, setState] = useState<AdminState>({
    id: null,
    email: null,
    role: null,
    isLoading: true,
    error: null,
  });

  const supabase = createClient();

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setState({
            id: null,
            email: null,
            role: null,
            isLoading: false,
            error: userError?.message || "Not authenticated",
          });
          return;
        }

        // Check if user exists in admins table
        const res = await fetch(
          `/api/admin/admins?email.eq=${encodeURIComponent(user.email!)}&select=id,email,role_id`,
        );
        const admins = await res.json();

        if (!Array.isArray(admins) || admins.length === 0) {
          setState({
            id: null,
            email: user.email || null,
            role: null,
            isLoading: false,
            error: "Not an admin",
          });
          return;
        }

        const admin = admins[0];
        let role: AdminRole = "super_admin";

        if (admin.role_id) {
          const roleRes = await fetch(`/api/admin/roles/${admin.role_id}?select=name`);
          const roleData = await roleRes.json();
          if (roleData?.name) {
            role = roleData.name as AdminRole;
          }
        }

        setState({
          id: admin.id,
          email: admin.email,
          role,
          isLoading: false,
          error: null,
        });
      } catch {
        setState({
          id: null,
          email: null,
          role: null,
          isLoading: false,
          error: "Failed to fetch admin data",
        });
      }
    };

    fetchAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchAdmin();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    ...state,
    hasPermission: (permission: string) => hasPermission(state.role || undefined, permission),
    hasAnyPermission: (permissions: string[]) =>
      hasAnyPermission(state.role || undefined, permissions),
    permissions: state.role ? ROLE_PERMISSIONS[state.role] : [],
  };
}
