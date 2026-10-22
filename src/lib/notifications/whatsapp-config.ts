const DEFAULT_GRAPH_URL = "https://graph.facebook.com/v21.0";

/** Webhook da Meta: precisa do token de verificação e do segredo do app. Sem eles, fica desligado. */
export function whatsappWebhookConfig(
  env: Record<string, string | undefined> = process.env,
): { verifyToken: string; appSecret: string } | null {
  const verifyToken = env.WHATSAPP_VERIFY_TOKEN;
  const appSecret = env.WHATSAPP_APP_SECRET;
  if (!verifyToken || verifyToken.length < 16 || !appSecret || appSecret.length < 16) return null;
  return { verifyToken, appSecret };
}

/** O template do lembrete tem os botões "Confirmo" / "Preciso cancelar" (opt-in: o template precisa existir assim na Meta). */
export function reminderButtonsEnabled(env: Record<string, string | undefined> = process.env) {
  return env.WHATSAPP_REMINDER_BUTTONS === "true";
}

/** Base da Graph API; só https (WHATSAPP_API_BASE existe para testes e proxies). */
export function graphBaseUrl(env: Record<string, string | undefined> = process.env) {
  const custom = env.WHATSAPP_API_BASE?.replace(/\/$/, "");
  return custom && /^https:\/\//.test(custom) ? custom : DEFAULT_GRAPH_URL;
}
