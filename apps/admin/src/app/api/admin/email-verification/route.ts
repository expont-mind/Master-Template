import { NextRequest, NextResponse } from "next/server";

import { sendVerificationEmail } from "@/lib/email";
import { log } from "@/lib/observability/log";
import { createAdminClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/utils/brand-config";
import { createVerifyToken } from "@/lib/verify-token";

type AdminClient = ReturnType<typeof createAdminClient>;
type AdminLoginEmailRow = {
  id: string;
  admin_id: string;
  email: string;
  is_verified: boolean;
};
type EmailRecord = { id: string; email: string };

const conflictResponse = () =>
  NextResponse.json({ error: "Энэ имэйл хаяг өөр админд бүртгэгдсэн байна" }, { status: 400 });

/**
 * Verify the email doesn't already belong to a different admin (either as
 * a primary admin email or as an alt email registered to another admin).
 * Returns the existing alt-email row if one belongs to *this* admin, so the
 * caller can re-send verification rather than inserting a duplicate.
 */
async function resolveExistingAltEmail(
  supabase: AdminClient,
  email: string,
  admin_id: string,
): Promise<{ kind: "conflict" } | { kind: "ok"; existing: AdminLoginEmailRow | null }> {
  const { data: existingAdmin } = await supabase
    .from("admins")
    .select("id")
    .eq("email", email)
    .single();
  if (existingAdmin) return { kind: "conflict" };

  // The 47-table union appears to trip TS instantiation on this
  // call; narrow the result shape explicitly via `.single<T>()`.
  const { data: existingAlt } = await supabase
    .from("admin_login_emails")
    .select("*")
    .eq("email", email)
    .single<AdminLoginEmailRow>();

  if (existingAlt && existingAlt.admin_id !== admin_id) return { kind: "conflict" };
  return { kind: "ok", existing: existingAlt };
}

async function upsertAltEmail(
  supabase: AdminClient,
  existing: AdminLoginEmailRow | null,
  admin_id: string,
  email: string,
): Promise<{ record: EmailRecord } | { error: string }> {
  if (existing) {
    const { data, error } = await supabase
      .from("admin_login_emails")
      .update({ is_verified: false, verified_at: null } as never)
      .eq("id", existing.id)
      .select("*")
      .single<EmailRecord>();
    if (error || !data) return { error: error?.message ?? "Update failed" };
    return { record: data };
  }
  const { data, error } = await supabase
    .from("admin_login_emails")
    .insert({ admin_id, email, is_verified: false } as never)
    .select("*")
    .single<EmailRecord>();
  if (error || !data) return { error: error?.message ?? "Insert failed" };
  return { record: data };
}

// POST: Нэмэлт имэйл нэмэх + баталгаажуулах линк илгээх
export async function POST(request: NextRequest) {
  try {
    const { admin_id, email } = await request.json();

    if (!admin_id || !email) {
      return NextResponse.json({ error: "admin_id болон email шаардлагатай" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const conflictCheck = await resolveExistingAltEmail(supabase, email, admin_id);
    if (conflictCheck.kind === "conflict") return conflictResponse();

    // Auth user үүсгэх (байхгүй бол)
    await supabase.auth.admin.createUser({ email, email_confirm: true });

    const result = await upsertAltEmail(supabase, conflictCheck.existing, admin_id, email);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Баталгаажуулах линк үүсгэж имэйл илгээх
    const token = createVerifyToken(result.record.id, email);
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? BRAND.url;
    const verifyUrl = `${adminUrl}/api/admin/email-verification/confirm?token=${token}`;

    await sendVerificationEmail(email, verifyUrl);

    return NextResponse.json(
      {
        id: result.record.id,
        email: result.record.email,
        message: "Баталгаажуулах линк илгээгдлээ",
      },
      { status: 201 },
    );
  } catch (error) {
    log.error("email_verification_post_error", error);
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 });
  }
}
