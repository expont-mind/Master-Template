import { NextRequest, NextResponse } from "next/server";

import { log } from "@/lib/observability/log";
import { createAdminClient } from "@/lib/supabase/server";

type AdminClient = ReturnType<typeof createAdminClient>;

interface AdminStatus {
  isAdmin: boolean;
  twoFactorEnabled: boolean;
}

async function resolveAdminStatus(supabase: AdminClient, email: string): Promise<AdminStatus> {
  const { data: adminRow } = await supabase
    .from("admins")
    .select("id, two_factor_enabled")
    .eq("email", email)
    .single<{ id: string; two_factor_enabled: boolean }>();

  if (adminRow) {
    return { isAdmin: true, twoFactorEnabled: adminRow.two_factor_enabled };
  }

  // Нэмэлт имэйлээр шалгах (alt email)
  const { data: altEmail } = await supabase
    .from("admin_login_emails")
    .select("admin_id")
    .eq("email", email)
    .eq("is_verified", true)
    .single<{ admin_id: string }>();

  if (!altEmail) {
    return { isAdmin: false, twoFactorEnabled: true };
  }

  const { data: parentAdmin } = await supabase
    .from("admins")
    .select("two_factor_enabled")
    .eq("id", altEmail.admin_id)
    .single<{ two_factor_enabled: boolean }>();
  return {
    isAdmin: true,
    twoFactorEnabled: parentAdmin?.two_factor_enabled ?? true,
  };
}

async function issueMagicLinkHash(supabase: AdminClient, email: string): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error || !data?.properties?.hashed_token) {
    log.error("direct_login_generate_link_error", error);
    return null;
  }
  return data.properties.hashed_token;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email шаардлагатай" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { isAdmin, twoFactorEnabled } = await resolveAdminStatus(supabase, email);

    if (!isAdmin) {
      return NextResponse.json({ error: "Танд админ эрх байхгүй байна" }, { status: 403 });
    }

    // 2FA ON → token_hash үүсгэхгүй, зөвхөн status буцаана
    if (twoFactorEnabled) {
      return NextResponse.json({ twoFactorEnabled: true });
    }

    // 2FA OFF → шууд нэвтрэх token үүсгэх
    const tokenHash = await issueMagicLinkHash(supabase, email);
    if (!tokenHash) {
      return NextResponse.json({ error: "Нэвтрэхэд алдаа гарлаа" }, { status: 500 });
    }

    return NextResponse.json({
      twoFactorEnabled: false,
      token_hash: tokenHash,
    });
  } catch (error) {
    log.error("direct_login_error", error);
    return NextResponse.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}
