import "server-only";
import { integrationsEnv } from "@/lib/env";
import type { DeliveryResult } from "./types";

const GRAPH_URL = "https://graph.facebook.com/v21.0";

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
}): Promise<DeliveryResult> {
  const env = integrationsEnv();
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    return { status: "skipped", reason: "WhatsApp não configurado" };
  }

  try {
    const response = await fetch(`${GRAPH_URL}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
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
