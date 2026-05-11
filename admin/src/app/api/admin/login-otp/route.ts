import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { sendOtpEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createOtpToken(email: string, code: string): string {
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
  const payload = JSON.stringify({
    email,
    codeHash,
    exp: Date.now() + 5 * 60 * 1000, // 5 минут
  });
  const hmac = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");
  return Buffer.from(payload).toString("base64") + "." + hmac;
}

function verifyOtpToken(
  token: string,
  email: string,
  code: string,
): { valid: boolean; error?: string } {
  try {
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return { valid: false, error: "Токен буруу" };

    const payloadB64 = token.slice(0, dotIndex);
    const hmac = token.slice(dotIndex + 1);
    const payload = Buffer.from(payloadB64, "base64").toString();
    const expectedHmac = crypto
      .createHmac("sha256", SECRET)
      .update(payload)
      .digest("hex");

    if (hmac !== expectedHmac) return { valid: false, error: "Токен буруу" };

    const data = JSON.parse(payload);
    if (data.email !== email) return { valid: false, error: "Имэйл таарахгүй" };

    if (Date.now() > data.exp)
      return { valid: false, error: "Кодын хугацаа дууссан" };

    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    if (data.codeHash !== codeHash)
      return { valid: false, error: "Код буруу байна" };

    return { valid: true };
  } catch {
    return { valid: false, error: "Токен буруу" };
  }
}

// POST: OTP код үүсгэх + nodemailer-ээр илгээх
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
      .single<{ id: string; two_factor_enabled: boolean }>();

    let isAdmin = false;
    let twoFactorEnabled = true;

    if (admin) {
      isAdmin = true;
      twoFactorEnabled = admin.two_factor_enabled;
    } else {
      const { data: altEmail } = await supabase
        .from("admin_login_emails")
        .select("admin_id")
        .eq("email", email)
        .eq("is_verified", true)
        .single<{ admin_id: string }>();

      if (altEmail) {
        isAdmin = true;
        const { data: parentAdmin } = await supabase
          .from("admins")
          .select("two_factor_enabled")
          .eq("id", altEmail.admin_id)
          .single<{ two_factor_enabled: boolean }>();
        twoFactorEnabled = parentAdmin?.two_factor_enabled ?? true;
      }
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Танд админ эрх байхгүй байна" },
        { status: 403 },
      );
    }

    if (!twoFactorEnabled) {
      return NextResponse.json(
        { error: "2FA идэвхгүй байна" },
        { status: 400 },
      );
    }

    // OTP код үүсгэх
    const code = generateCode();
    const otpToken = createOtpToken(email, code);

    // Nodemailer-ээр илгээх
    await sendOtpEmail(email, code);

    return NextResponse.json({ otpToken });
  } catch (error) {
    console.error("Login OTP POST error:", error);
    return NextResponse.json(
      { error: "Код илгээхэд алдаа гарлаа" },
      { status: 500 },
    );
  }
}

// PATCH: OTP шалгах + session үүсгэх
export async function PATCH(request: NextRequest) {
  try {
    const { email, code, otpToken } = await request.json();

    if (!email || !code || !otpToken) {
      return NextResponse.json(
        { error: "email, code, otpToken шаардлагатай" },
        { status: 400 },
      );
    }

    // OTP шалгах
    const result = verifyOtpToken(otpToken, email, code);
    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || "Код буруу байна" },
        { status: 400 },
      );
    }

    // Session үүсгэх: generateLink ашиглан token_hash авах
    const supabase = createAdminClient();
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("Generate link error:", linkError);
      return NextResponse.json(
        { error: "Session үүсгэхэд алдаа гарлаа" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      token_hash: linkData.properties.hashed_token,
    });
  } catch (error) {
    console.error("Login OTP PATCH error:", error);
    return NextResponse.json(
      { error: "Серверийн алдаа" },
      { status: 500 },
    );
  }
}
