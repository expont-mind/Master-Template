import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { log } from "../_shared/log.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Firebase service account JSON (stored as Supabase secret: FIREBASE_SERVICE_ACCOUNT)
const serviceAccount = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "{}");

// ─── JWT / OAuth2 helpers ────────────────────────────────────────

function base64url(data: string | ArrayBuffer): string {
  const str =
    typeof data === "string" ? btoa(data) : btoa(String.fromCharCode(...new Uint8Array(data)));
  return str.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
    }),
  );

  // Import RSA private key
  const pem = serviceAccount.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");
  const keyData = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  // Sign JWT
  const unsigned = new TextEncoder().encode(`${header}.${payload}`);
  const signature = base64url(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, unsigned));
  const jwt = `${header}.${payload}.${signature}`;

  // Exchange JWT for access token
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Google token exchange failed: ${JSON.stringify(data)}`);
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000,
  };
  return data.access_token;
}

// ─── FCM send ────────────────────────────────────────────────────

async function sendFCM(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  const accessToken = await getAccessToken();

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: { title, body },
          data: data ?? {},
          android: {
            notification: {
              channel_id: "high_importance_channel",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
              },
            },
          },
        },
      }),
    },
  );

  if (!res.ok) {
    const error = await res.text();
    log.error(`FCM send failed: ${res.status} ${error}`);
  }
}

// ─── Handler ─────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  try {
    const { user_id, title, body, data } = (await req.json()) as {
      user_id: string;
      title: string;
      body?: string;
      data?: Record<string, string>;
    };

    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: "user_id and title required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Get user's FCM token
    const { data: user } = await admin.from("users").select("fcm_token").eq("id", user_id).single();

    if (!user?.fcm_token) {
      return new Response(JSON.stringify({ success: false, reason: "no_fcm_token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    await sendFCM(user.fcm_token, title, body ?? "", data);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    log.error("[send-push-notification]", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
