import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email шаардлагатай" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Admin эсэх шалгах
    const { data: admin } = await supabase
      .from("admins")
      .select("id, two_factor_enabled")
      .eq("email", email)
      .single();

    let isAdmin = false;
    let twoFactorEnabled = true;

    if (admin) {
      isAdmin = true;
      twoFactorEnabled = admin.two_factor_enabled;
    } else {
      // Нэмэлт имэйлээр шалгах
      const { data: altEmail } = await supabase
        .from("admin_login_emails")
        .select("admin_id")
        .eq("email", email)
        .eq("is_verified", true)
        .single();

      if (altEmail) {
        isAdmin = true;
        const { data: parentAdmin } = await supabase
          .from("admins")
          .select("two_factor_enabled")
          .eq("id", altEmail.admin_id)
          .single();
        twoFactorEnabled = parentAdmin?.two_factor_enabled ?? true;
      }
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Танд админ эрх байхгүй байна" },
        { status: 403 },
      );
    }

    // 2FA ON → token_hash үүсгэхгүй, зөвхөн status буцаана
    if (twoFactorEnabled) {
      return NextResponse.json({ twoFactorEnabled: true });
    }

    // 2FA OFF → шууд нэвтрэх token үүсгэх
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("Generate link error:", linkError);
      return NextResponse.json(
        { error: "Нэвтрэхэд алдаа гарлаа" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      twoFactorEnabled: false,
      token_hash: linkData.properties.hashed_token,
    });
  } catch (error) {
    console.error("Direct login error:", error);
    return NextResponse.json(
      { error: "Серверийн алдаа" },
      { status: 500 },
    );
  }
}
