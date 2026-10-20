import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "./tokens";

export const SESSION_COOKIE = "session";
const SESSION_DAYS = 30;

/** Cria a sessão no banco e grava o cookie (httpOnly) com o token sem hash. */
export async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600_000);

  await db.session.create({
    data: { user_id: userId, token_hash: hashToken(token), expires_at: expiresAt },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token_hash: hashToken(token) } });
  }
  store.delete(SESSION_COOKIE);
}

/** Usuário da sessão atual (deduplicado por requisição). Sessões vencidas não valem. */
export const getSessionUser = cache(async () => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token_hash: hashToken(token) },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!session || session.expires_at < new Date()) return null;
  return session.user;
});
