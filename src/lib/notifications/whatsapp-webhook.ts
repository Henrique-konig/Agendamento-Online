import { createHmac, timingSafeEqual } from "node:crypto";

/** Confere X-Hub-Signature-256 ("sha256=<hex>") do corpo bruto com o segredo do app da Meta. */
export function verifyMetaSignature(
  rawBody: string,
  header: string | null,
  appSecret: string,
): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const received = Buffer.from(header.slice("sha256=".length), "hex");
  const expected = createHmac("sha256", appSecret).update(rawBody).digest();
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/** Confere hub.verify_token da verificação inicial do webhook, sem vazar por tempo de resposta. */
export function verifyTokenMatches(received: string | null, expected: string): boolean {
  if (!received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type ReplyAction = "confirm" | "cancel";
export type IncomingReply = { from: string; action: ReplyAction; token: string };

const PAYLOAD = /^(confirm|cancel):([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

/** Payload dos botões do lembrete: "confirm:<token>" ou "cancel:<token>". */
export function buttonPayload(action: ReplyAction, token: string) {
  return `${action}:${token}`;
}

export function parseButtonPayload(
  payload: unknown,
): { action: ReplyAction; token: string } | null {
  if (typeof payload !== "string") return null;
  const match = PAYLOAD.exec(payload);
  return match ? { action: match[1] as ReplyAction, token: match[2] } : null;
}

type WebhookBody = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from?: string;
          type?: string;
          button?: { payload?: string };
          interactive?: { button_reply?: { id?: string } };
        }>;
      };
    }>;
  }>;
};

/**
 * Extrai as respostas por botão (do template com respostas rápidas ou de mensagens
 * interativas). Qualquer outra coisa — texto livre, status de entrega — é ignorada.
 */
export function extractReplies(body: unknown): IncomingReply[] {
  const replies: IncomingReply[] = [];
  for (const entry of (body as WebhookBody)?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        const raw =
          message.type === "button"
            ? message.button?.payload
            : message.type === "interactive"
              ? message.interactive?.button_reply?.id
              : undefined;
        const parsed = parseButtonPayload(raw);
        if (parsed && typeof message.from === "string") {
          replies.push({ from: message.from, ...parsed });
        }
      }
    }
  }
  return replies;
}
