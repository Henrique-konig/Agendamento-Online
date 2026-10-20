import "server-only";
import { integrationsEnv, siteUrl } from "@/lib/env";

/** Configuração da integração, ou null se as variáveis não estiverem definidas. */
export function googleConfig() {
  const env = integrationsEnv();
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_TOKEN_ENCRYPTION_KEY) {
    return null;
  }
  return {
    credentials: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
    encryptionKey: env.GOOGLE_TOKEN_ENCRYPTION_KEY,
    redirectUri: siteUrl("/api/google/callback"),
  };
}

export type GoogleConfig = NonNullable<ReturnType<typeof googleConfig>>;
