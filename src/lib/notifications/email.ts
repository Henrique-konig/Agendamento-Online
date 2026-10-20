import "server-only";
import { integrationsEnv } from "@/lib/env";
import type { DeliveryResult } from "./types";

const RESEND_URL = "https://api.resend.com/emails";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Evita envio duplicado se a mesma operação for repetida. */
  idempotencyKey?: string;
};

/** Envia e-mail pela API REST do Resend (https://resend.com/docs/api-reference). */
export async function sendEmail(message: EmailMessage): Promise<DeliveryResult> {
  const env = integrationsEnv();
  if (!env.RESEND_API_KEY) return { status: "skipped", reason: "RESEND_API_KEY ausente" };

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
