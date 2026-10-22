import { z } from "zod";

const schema = z.object({
  VAPID_PUBLIC_KEY: z.string().min(80),
  VAPID_PRIVATE_KEY: z.string().min(40),
  VAPID_SUBJECT: z
    .string()
    .regex(/^(mailto:|https:\/\/)/, "use mailto:voce@email.com ou https://..."),
});

export type PushConfig = { publicKey: string; privateKey: string; subject: string };

/**
 * Chaves VAPID do Web Push. Sem as três variáveis (ou com valor inválido) o
 * push fica desligado, sem afetar o resto. Gere com: npx web-push generate-vapid-keys
 */
export function pushConfig(
  env: Record<string, string | undefined> = process.env,
): PushConfig | null {
  const parsed = schema.safeParse({
    VAPID_PUBLIC_KEY: env.VAPID_PUBLIC_KEY || undefined,
    VAPID_PRIVATE_KEY: env.VAPID_PRIVATE_KEY || undefined,
    VAPID_SUBJECT: env.VAPID_SUBJECT || undefined,
  });
  if (!parsed.success) return null;
  return {
    publicKey: parsed.data.VAPID_PUBLIC_KEY,
    privateKey: parsed.data.VAPID_PRIVATE_KEY,
    subject: parsed.data.VAPID_SUBJECT,
  };
}

/** Serviços de push dos navegadores: só eles recebem requisições do servidor. */
const PUSH_HOST_SUFFIXES = [
  "fcm.googleapis.com", // Chrome, Edge, Android
  "android.googleapis.com", // Chrome (legado)
  ".push.services.mozilla.com", // Firefox
  ".push.apple.com", // Safari / iOS
  ".notify.windows.com", // Edge (WNS)
];

/**
 * O endereço da inscrição vem do navegador do usuário e o servidor faz POST nele.
 * Sem esta checagem, qualquer conta poderia apontar para serviços internos (SSRF).
 * `PUSH_EXTRA_HOSTS` (hosts separados por vírgula) só serve para testes.
 */
export function isAllowedPushEndpoint(
  endpoint: string,
  env: Record<string, string | undefined> = process.env,
): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  const extra = (env.PUSH_EXTRA_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  if (extra.includes(host)) return true;
  return PUSH_HOST_SUFFIXES.some((suffix) =>
    suffix.startsWith(".") ? host.endsWith(suffix) : host === suffix,
  );
}
