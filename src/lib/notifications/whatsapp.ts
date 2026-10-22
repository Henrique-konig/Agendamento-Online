import "server-only";
import { integrationsEnv } from "@/lib/env";
import type { DeliveryResult } from "./types";
import { graphBaseUrl } from "./whatsapp-config";

export function isWhatsAppConfigured() {
  const env = integrationsEnv();
  return Boolean(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Envia uma mensagem de template pela WhatsApp Cloud API (Meta).
 * Mensagens iniciadas pela empresa exigem template aprovado — veja
 * docs/LEMBRETES.md para o texto sugerido.
 */
export async function sendWhatsAppTemplate(input: {
  to: string;
  template: string;
  bodyParams: string[];
  /** Payloads dos botões de resposta rápida do template (na ordem em que foram criados na Meta). */
  buttonPayloads?: string[];
}): Promise<DeliveryResult> {
  const env = integrationsEnv();
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    return { status: "skipped", reason: "WhatsApp não configurado" };
  }

  try {
    const response = await fetch(`${graphBaseUrl()}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.to,
        type: "template",
        template: {
          name: input.template,
          language: { code: env.WHATSAPP_TEMPLATE_LANGUAGE },
          components: [
            {
              type: "body",
              parameters: input.bodyParams.map((text) => ({ type: "text", text })),
            },
            ...(input.buttonPayloads ?? []).map((payload, index) => ({
              type: "button",
              sub_type: "quick_reply",
              index: String(index),
              parameters: [{ type: "payload", payload }],
            })),
          ],
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const body = (await response.json().catch(() => ({}))) as {
      messages?: Array<{ id: string }>;
      error?: { message?: string };
    };
    if (!response.ok) {
      return { status: "failed", error: body.error?.message ?? `HTTP ${response.status}` };
    }
    return { status: "sent", providerId: body.messages?.[0]?.id };
  } catch (e) {
    return { status: "failed", error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Mensagem de texto livre. A Meta só aceita dentro de 24 h depois de o cliente escrever,
 * o que vale para a resposta a um botão (ele acabou de interagir).
 */
export async function sendWhatsAppText(input: {
  to: string;
  body: string;
}): Promise<DeliveryResult> {
  const env = integrationsEnv();
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    return { status: "skipped", reason: "WhatsApp não configurado" };
  }
  try {
    const response = await fetch(`${graphBaseUrl()}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.to,
        type: "text",
        text: { body: input.body, preview_url: false },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await response.json().catch(() => ({}))) as {
      messages?: Array<{ id: string }>;
      error?: { message?: string };
    };
    if (!response.ok) {
      return { status: "failed", error: body.error?.message ?? `HTTP ${response.status}` };
    }
    return { status: "sent", providerId: body.messages?.[0]?.id };
  } catch (e) {
    return { status: "failed", error: e instanceof Error ? e.message : String(e) };
  }
}
