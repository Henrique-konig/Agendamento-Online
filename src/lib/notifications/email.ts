import "server-only";
import nodemailer from "nodemailer";
import { integrationsEnv, type IntegrationsEnv } from "@/lib/env";
import type { DeliveryResult } from "./types";

const RESEND_URL = "https://api.resend.com/emails";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Evita envio duplicado em provedores que suportam (Resend). */
  idempotencyKey?: string;
};

/** Há algum provedor de e-mail configurado? (SMTP ou Resend) */
export function isEmailConfigured() {
  const env = integrationsEnv();
  return Boolean((env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) || env.RESEND_API_KEY);
}

/**
 * Envia e-mail pelo provedor configurado: SMTP (Gmail, Brevo, SES, Mailgun...)
 * quando SMTP_HOST/USER/PASSWORD existem; senão, a API do Resend.
 */
export async function sendEmail(message: EmailMessage): Promise<DeliveryResult> {
  const env = integrationsEnv();
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) return sendViaSmtp(env, message);
  if (env.RESEND_API_KEY) return sendViaResend(env, message);
  return { status: "skipped", reason: "nenhum provedor de e-mail configurado" };
}

async function sendViaSmtp(env: IntegrationsEnv, message: EmailMessage): Promise<DeliveryResult> {
  try {
    const transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      // 465 = TLS direto; 587 = STARTTLS (ativado automaticamente pelo servidor).
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
      connectionTimeout: 10_000,
      socketTimeout: 15_000,
    });
    const info = await transport.sendMail({
      from: env.EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    });
    return { status: "sent", providerId: info.messageId };
  } catch (e) {
    return { status: "failed", error: e instanceof Error ? e.message : String(e) };
  }
}

/** Resend pela API REST (https://resend.com/docs/api-reference). */
async function sendViaResend(env: IntegrationsEnv, message: EmailMessage): Promise<DeliveryResult> {
  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        ...(message.idempotencyKey ? { "Idempotency-Key": message.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!response.ok) return { status: "failed", error: body.message ?? `HTTP ${response.status}` };
    return { status: "sent", providerId: body.id };
  } catch (e) {
    return { status: "failed", error: e instanceof Error ? e.message : String(e) };
  }
}
