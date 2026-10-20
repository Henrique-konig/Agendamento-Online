import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { decrypt, encrypt } from "@/lib/crypto/secretbox";
import { GoogleAuthError, refreshAccessToken } from "@/lib/google/oauth";
import type { Database, Tables } from "@/types/database";
import { googleConfig, type GoogleConfig } from "./config";

type Admin = SupabaseClient<Database>;
export type GoogleConnection = Tables<"google_connections">;

/** Margem para renovar o token antes de expirar. */
const EXPIRY_MARGIN_MS = 60_000;

export async function getConnection(admin: Admin, professionalId: string) {
  const { data } = await admin
    .from("google_connections")
    .select("*")
    .eq("professional_id", professionalId)
    .maybeSingle();
  return data;
}

export async function recordGoogleError(admin: Admin, professionalId: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[google]", professionalId, message);
  await admin
    .from("google_connections")
    .update({ last_error: message.slice(0, 500), last_error_at: new Date().toISOString() })
    .eq("professional_id", professionalId);
}

/** Devolve um access token válido, renovando com o refresh token quando necessário. */
export async function getAccessToken(
  admin: Admin,
  connection: GoogleConnection,
  config: GoogleConfig,
): Promise<string> {
  const expiresAt = connection.access_token_expires_at
    ? new Date(connection.access_token_expires_at).getTime()
    : 0;
  if (connection.access_token_enc && expiresAt - EXPIRY_MARGIN_MS > Date.now()) {
    return decrypt(connection.access_token_enc, config.encryptionKey);
  }

  const refreshToken = decrypt(connection.refresh_token_enc, config.encryptionKey);
  const tokens = await refreshAccessToken(refreshToken, config.credentials);

  await admin
    .from("google_connections")
    .update({
      access_token_enc: encrypt(tokens.access_token, config.encryptionKey),
      access_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      // O Google pode rotacionar o refresh token.
      ...(tokens.refresh_token
        ? { refresh_token_enc: encrypt(tokens.refresh_token, config.encryptionKey) }
        : {}),
      last_error: null,
      last_error_at: null,
    })
    .eq("professional_id", connection.professional_id);

  return tokens.access_token;
}

/**
 * Executa uma operação autenticada no Google para o profissional. Retorna null
 * se não houver integração; erros são registrados e não interrompem o fluxo.
 */
export async function withGoogle<T>(
  admin: Admin,
  professionalId: string,
  operation: (ctx: { accessToken: string; connection: GoogleConnection }) => Promise<T>,
  options: { when?: (connection: GoogleConnection) => boolean } = {},
): Promise<T | null> {
  const config = googleConfig();
  if (!config) return null;
  const connection = await getConnection(admin, professionalId);
  if (!connection || (options.when && !options.when(connection))) return null;

  try {
    const accessToken = await getAccessToken(admin, connection, config);
    return await operation({ accessToken, connection });
  } catch (e) {
    const message =
      e instanceof GoogleAuthError && e.code === "invalid_grant"
        ? "Acesso ao Google revogado ou expirado. Reconecte a conta."
        : e;
    await recordGoogleError(admin, professionalId, message);
    return null;
  }
}
