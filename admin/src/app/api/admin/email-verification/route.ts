import { createAdminClient } from "@/lib/supabase/server";
import { sendVerificationEmail } from "@/lib/email";
import { createVerifyToken } from "@/lib/verify-token";
import { BRAND } from "@/lib/utils/brand-config";
import { NextRequest, NextResponse } from "next/server";

interface AdminLoginEmail {
  id: string;
  admin_id: string;
  email: string;
  is_verified: boolean;
  verification_code: string | null;
  verification_expires_at: string | null;
  verified_at: string | null;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminLoginEmails(supabase: ReturnType<typeof createAdminClient>): any {
  return supabase.from("admin_login_emails" as never);
}

// POST: Нэмэлт имэйл нэмэх + баталгаажуулах линк илгээх
export async function POST(request: NextRequest) {
  try {
    const { admin_id, email } = await request.json();

    if (!admin_id || !email) {
      return NextResponse.json(
        { error: "admin_id болон email шаардлагатай" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Энэ имэйл admins хүснэгтэд бүртгэлтэй эсэх
    const { data: existingAdmin } = await supabase
      .from("admins")
      .select("id")
      .eq("email", email)
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Энэ имэйл хаяг өөр админд бүртгэгдсэн байна" },
        { status: 400 },
      );
    }

    // admin_login_emails-д аль хэдийн бүртгэлтэй эсэх
    const { data } = await adminLoginEmails(supabase)
      .select("*")
      .eq("email", email)
      .single();

    const existingAlt = data as AdminLoginEmail | null;

    if (existingAlt && existingAlt.admin_id !== admin_id) {
      return NextResponse.json(
        { error: "Энэ имэйл хаяг өөр админд бүртгэгдсэн байна" },
        { status: 400 },
      );
    }

    // Auth user үүсгэх (байхгүй бол)
    await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    let emailRecord: AdminLoginEmail;

    if (existingAlt && existingAlt.admin_id === admin_id) {
      const { data: updated, error: updateError } = await adminLoginEmails(
        supabase,
      )
        .update({ is_verified: false, verified_at: null })
        .eq("id", existingAlt.id)
        .select("*")
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 },
        );
      }
      emailRecord = updated as AdminLoginEmail;
    } else {
      const { data: inserted, error: insertError } = await adminLoginEmails(
        supabase,
      )
        .insert({
          admin_id,
          email,
          is_verified: false,
        })
        .select("*")
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 },
        );
      }
      emailRecord = inserted as AdminLoginEmail;
    }

    // Баталгаажуулах линк үүсгэж имэйл илгээх
    const token = createVerifyToken(emailRecord.id, email);
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? BRAND.url;
    const verifyUrl = `${adminUrl}/api/admin/email-verification/confirm?token=${token}`;

    await sendVerificationEmail(email, verifyUrl);

    return NextResponse.json(
      {
        id: emailRecord.id,
        email: emailRecord.email,
        message: "Баталгаажуулах линк илгээгдлээ",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Email verification POST error:", error);
    return NextResponse.json(
      { error: "Серверийн алдаа гарлаа" },
      { status: 500 },
    );
  }
}
