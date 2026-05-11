import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(to: string, code: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "Монпанг Админ - Нэвтрэх код",
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="text-align: center; color: #111;">Монпанг Админ</h2>
        <p style="color: #333;">Таны нэвтрэх код:</p>
        <div style="text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: #f5f5f5; border-radius: 8px; color: #111;">
          ${code}
        </div>
        <p style="color: #888; font-size: 14px; margin-top: 16px;">
          Код 5 минутын дотор хүчинтэй.
        </p>
      </div>
    `,
  });
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "Монпанг Админ - Имэйл баталгаажуулах",
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="text-align: center; color: #111;">Монпанг Админ</h2>
        <p style="color: #333;">Таны имэйл хаягийг админ системд нэмэх хүсэлт ирлээ.</p>
        <p style="color: #333;">Доорх товчийг дарж баталгаажуулна уу:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 32px; background: #111; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Баталгаажуулах
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">
          Линк 24 цагийн дотор хүчинтэй.
        </p>
        <p style="color: #888; font-size: 12px;">
          Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тоомсорлоно уу.
        </p>
      </div>
    `,
  });
}
