import { createAdminClient } from "@/lib/supabase/server";
import { sendVerificationEmail } from "@/lib/email";
import { createVerifyToken } from "@/lib/verify-token";
import { BRAND } from "@/lib/utils/brand-config";
import { NextRequest, NextResponse } from "next/server";

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

    // admin_login_emails-д аль хэдийн бүртгэлтэй эсэх.
    // The 47-table union appears to trip TS instantiation on this
    // call; narrow the result shape explicitly via `.single<T>()`.
    type AdminLoginEmailRow = {
      id: string;
      admin_id: string;
      email: string;
      is_verified: boolean;
    };
    const { data: existingAlt } = await supabase
      .from("admin_login_emails")
      .select("*")
      .eq("email", email)
      .single<AdminLoginEmailRow>();

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

    let emailRecord: { id: string; email: string };

    if (existingAlt && existingAlt.admin_id === admin_id) {
      const { data: updated, error: updateError } = await supabase
        .from("admin_login_emails")
        .update({ is_verified: false, verified_at: null } as never)
        .eq("id", existingAlt.id)
        .select("*")
        .single<{ id: string; email: string }>();

      if (updateError || !updated) {
        return NextResponse.json(
          { error: updateError?.message ?? "Update failed" },
          { status: 500 },
        );
      }
      emailRecord = updated;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("admin_login_emails")
        .insert({
          admin_id,
          email,
          is_verified: false,
        } as never)
        .select("*")
        .single<{ id: string; email: string }>();

      if (insertError || !inserted) {
        return NextResponse.json(
          { error: insertError?.message ?? "Insert failed" },
          { status: 500 },
        );
      }
      emailRecord = inserted;
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
