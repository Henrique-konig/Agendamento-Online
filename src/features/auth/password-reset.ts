import "server-only";
import { passwordResetEmail } from "@/features/notifications/templates";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/env";
import { sendEmail } from "@/lib/notifications/email";

export const RESET_TOKEN_MINUTES = 60;
const MAX_REQUESTS_PER_WINDOW = 3;
const WINDOW_MS = 15 * 60_000;

/**
 * Cria um link de redefinição e envia por e-mail. Devolve sempre sem erro: quem
 * chama responde igual exista a conta ou não, para não revelar e-mails cadastrados.
 */
export async function sendPasswordResetLink(email: string) {
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return;

  const recent = await db.passwordResetToken.count({
    where: { user_id: user.id, created_at: { gte: new Date(Date.now() - WINDOW_MS) } },
  });
  if (recent >= MAX_REQUESTS_PER_WINDOW) return;

  const token = generateToken();
  await db.$transaction([
    // Só o link mais recente vale.
    db.passwordResetToken.deleteMany({ where: { user_id: user.id } }),
    db.passwordResetToken.create({
      data: {
        user_id: user.id,
        token_hash: hashToken(token),
        expires_at: new Date(Date.now() + RESET_TOKEN_MINUTES * 60_000),
      },
    }),
  ]);

  const result = await sendEmail({
    to: email,
    ...passwordResetEmail({
      link: siteUrl(`/redefinir-senha?token=${encodeURIComponent(token)}`),
      expiresInMinutes: RESET_TOKEN_MINUTES,
    }),
  });
  if (result.status !== "sent") {
    console.error("[auth] e-mail de redefinição não enviado:", result);
  }
}

/** Token válido (existe e não venceu)? Retorna o id do usuário. */
export async function findUserByResetToken(token: string) {
  const row = await db.passwordResetToken.findUnique({
    where: { token_hash: hashToken(token) },
    select: { user_id: true, expires_at: true },
  });
  if (!row || row.expires_at < new Date()) return null;
  return row.user_id;
}
