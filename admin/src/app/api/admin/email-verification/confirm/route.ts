import { createAdminClient } from "@/lib/supabase/server";
import { verifyToken } from "@/lib/verify-token";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse(htmlPage("Линк буруу байна", false), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const result = verifyToken(token);

  if (!result.valid || !result.emailId) {
    return new NextResponse(
      htmlPage("Линк хүчингүй эсвэл хугацаа дууссан байна", false),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("admin_login_emails")
    .update({
      is_verified: true,
      verified_at: new Date().toISOString(),
    })
    .eq("id", result.emailId);

  if (error) {
    return new NextResponse(htmlPage("Баталгаажуулахад алдаа гарлаа", false), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new NextResponse(
    htmlPage("Имэйл амжилттай баталгаажлаа!", true),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

function htmlPage(message: string, success: boolean): string {
  const color = success ? "#22c55e" : "#ef4444";
  const icon = success ? "&#10003;" : "&#10007;";
  return `<!DOCTYPE html>
<html lang="mn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Монпанг Админ</title>
</head>
<body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5;">
  <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 400px;">
    <div style="font-size: 48px; color: ${color}; margin-bottom: 16px;">${icon}</div>
    <h2 style="color: #111; margin-bottom: 8px;">Монпанг Админ</h2>
    <p style="color: #333; font-size: 16px;">${message}</p>
    <p style="color: #888; font-size: 14px; margin-top: 16px;">Энэ цонхыг хааж болно.</p>
  </div>
</body>
</html>`;
}
