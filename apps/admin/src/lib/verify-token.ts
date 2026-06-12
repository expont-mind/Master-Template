import crypto from "crypto";

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function createVerifyToken(emailId: string, email: string): string {
  const payload = JSON.stringify({
    emailId,
    email,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 цаг
  });
  const hmac = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64url") + "." + hmac;
}

export function verifyToken(token: string): {
  valid: boolean;
  emailId?: string;
  email?: string;
} {
  try {
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return { valid: false };

    const payloadB64 = token.slice(0, dotIndex);
    const hmac = token.slice(dotIndex + 1);
    const payload = Buffer.from(payloadB64, "base64url").toString();
    const expectedHmac = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");

    if (hmac !== expectedHmac) return { valid: false };

    const data = JSON.parse(payload);
    if (Date.now() > data.exp) return { valid: false };

    return { valid: true, emailId: data.emailId, email: data.email };
  } catch {
    return { valid: false };
  }
}
