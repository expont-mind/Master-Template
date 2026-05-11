import { createAdminClient } from "@/lib/supabase/server";
import { activeSmsProvider, sendSms } from "@/lib/sms";
import { LOCALE } from "@/lib/utils/brand-config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { phone, message, user_id } = await request.json();

    if (!phone || !message) {
      return NextResponse.json(
        { error: "phone and message are required" },
        { status: 400 },
      );
    }

    const normalizedPhone = phone.replace(LOCALE.phoneRegex, "").replace(/\D/g, "");
    const result = await sendSms(normalizedPhone, message);

    // Log to sms_logs
    const supabase = createAdminClient();
    await supabase.from("sms_logs").insert({
      campaign_id: null,
      user_id: user_id || null,
      phone: normalizedPhone,
      message,
      status: result.success ? "sent" : "failed",
      provider: activeSmsProvider(),
      provider_message_id: result.messageId ?? null,
      error_message: result.error ?? null,
      sent_at: result.success ? new Date().toISOString() : null,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Single SMS send error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
