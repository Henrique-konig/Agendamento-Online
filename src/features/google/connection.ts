import "server-only";
import { db } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto/secretbox";
import { GoogleAuthError, refreshAccessToken } from "@/lib/google/oauth";
import type { GoogleConnection } from "@/types/models";
import { googleConfig, type GoogleConfig } from "./config";

export type { GoogleConnection };

/** Margem para renovar o token antes de expirar. */
const EXPIRY_MARGIN_MS = 60_000;

export function getConnection(professionalId: string) {
  return db.googleConnection.findUnique({ where: { professional_id: professionalId } });
}

export async function recordGoogleError(professionalId: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[google]", professionalId, message);
  await db.googleConnection.updateMany({
    where: { professional_id: professionalId },
    data: { last_error: message.slice(0, 500), last_error_at: new Date() },
  });
}

/** Devolve um access token válido, renovando com o refresh token quando necessário. */
export async function getAccessToken(
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

  await db.googleConnection.update({
    where: { professional_id: connection.professional_id },
    data: {
      access_token_enc: encrypt(tokens.access_token, config.encryptionKey),
      access_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000),
      // O Google pode rotacionar o refresh token.
      ...(tokens.refresh_token
        ? { refresh_token_enc: encrypt(tokens.refresh_token, config.encryptionKey) }
        : {}),
      last_error: null,
      last_error_at: null,
    },
  });

  return tokens.access_token;
}

/**
 * Executa uma operação autenticada no Google para o profissional. Retorna null
 * se não houver integração; erros são registrados e não interrompem o fluxo.
 */
export async function withGoogle<T>(
  professionalId: string,
  operation: (ctx: { accessToken: string; connection: GoogleConnection }) => Promise<T>,
  options: { when?: (connection: GoogleConnection) => boolean } = {},
): Promise<T | null> {
  const config = googleConfig();
  if (!config) return null;
  const connection = await getConnection(professionalId);
  if (!connection || (options.when && !options.when(connection))) return null;

  try {
    const accessToken = await getAccessToken(connection, config);
    return await operation({ accessToken, connection });
  } catch (e) {
    const message =
      e instanceof GoogleAuthError && e.code === "invalid_grant"
        ? "Acesso ao Google revogado ou expirado. Reconecte a conta."
        : e;
    await recordGoogleError(professionalId, message);
    return null;
  }
}
