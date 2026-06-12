"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { adminApi } from "@/lib/admin-api";
import { log } from "@/lib/observability/log";
import { createClient } from "@/lib/supabase/client";

export interface AdminData {
  id: string;
  email: string;
  two_factor_enabled: boolean;
  role_id: string | null;
}

export interface LoginEmail {
  id: string;
  admin_id: string;
  email: string;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
}

async function resolveAdminByEmail(userEmail: string): Promise<AdminData | null> {
  const admins = await adminApi.getAll<AdminData>("admins", {
    filters: { "email.eq": userEmail },
    select: "id,email,two_factor_enabled,role_id",
  });
  if (admins[0]) return admins[0];

  const altEmails = await adminApi.getAll<LoginEmail>("admin_login_emails", {
    filters: { "email.eq": userEmail, "is_verified.eq": "true" },
  });
  if (!altEmails[0]) return null;

  return adminApi.getById<AdminData>("admins", altEmails[0].admin_id, {
    select: "id,email,two_factor_enabled,role_id",
  });
}

export function useSecurityData() {
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loginEmails, setLoginEmails] = useState<LoginEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) return;

      const admin = await resolveAdminByEmail(user.email);
      if (!admin) return;

      setAdminData(admin);

      const emails = await adminApi.getAll<LoginEmail>("admin_login_emails", {
        filters: { "admin_id.eq": admin.id },
        order: "created_at.asc",
      });
      setLoginEmails(emails);
    } catch (error) {
      log.error("security_data_load_failed", error);
      toast.error("Мэдээлэл ачаалахад алдаа гарлаа");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  return {
    adminData,
    setAdminData,
    loginEmails,
    setLoginEmails,
    isLoading,
    reload: loadData,
  };
}
