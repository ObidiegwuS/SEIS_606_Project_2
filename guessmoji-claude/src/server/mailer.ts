import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Sends mail via SMTP settings from the environment (see .env.example).
 * If SMTP_HOST is not set outside production, the message is printed to the
 * server console instead so the link can be opened during local development.
 * The account stays unverified until that link is actually used.
 */

let transporter: Transporter | undefined;

function getTransporter(): Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

type Message = { subject: string; text: string; html: string };

async function send(to: string, { subject, text, html }: Message): Promise<void> {
  const t = getTransporter();
  if (!t) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured (SMTP_HOST missing)");
    }
    const link = text.match(/https?:\/\/\S+/)?.[0] ?? "";
    console.info(`\n[dev mail] To: ${to}\n[dev mail] Subject: ${subject}\n[dev mail] ${link}\n`);
    return;
  }
  await t.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text, html });
}

export function sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  return send(to, {
    subject: "Verify your GuessMoji email",
    text: [
      "Welcome to GuessMoji!",
      "",
      "Confirm your email address by opening this link (it expires in 24 hours):",
      verifyUrl,
      "",
      "If you didn't create this account, you can ignore this email.",
    ].join("\n"),
    html: `<p>Welcome to GuessMoji! 🎬🌍</p>
<p>Confirm your email address by clicking the link below. It expires in 24 hours.</p>
<p><a href="${verifyUrl}">Verify my email</a></p>
<p>If you didn't create this account, you can ignore this email.</p>`,
  });
}

export function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  return send(to, {
    subject: "Reset your GuessMoji password",
    text: [
      "We received a request to reset your GuessMoji password.",
      "",
      "Choose a new password by opening this link (it expires in 1 hour):",
      resetUrl,
      "",
      "If you didn't ask for this, you can ignore this email. Your password won't change.",
    ].join("\n"),
    html: `<p>We received a request to reset your GuessMoji password.</p>
<p><a href="${resetUrl}">Choose a new password</a> (this link expires in 1 hour).</p>
<p>If you didn't ask for this, you can ignore this email. Your password won't change.</p>`,
  });
}
