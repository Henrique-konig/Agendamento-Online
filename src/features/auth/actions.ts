"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { DUMMY_HASH, hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { findUserByResetToken, sendPasswordResetLink } from "./password-reset";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  safeNextPath,
  signInSchema,
  signUpSchema,
} from "./schemas";

const WINDOW_MS = 15 * 60_000;
const MAX_FAILS_PER_EMAIL = 5;
const MAX_FAILS_PER_IP = 30;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

/** Limita tentativas de senha por e-mail e por IP nos últimos 15 minutos. */
async function tooManyAttempts(email: string, ip: string | null) {
  const since = new Date(Date.now() - WINDOW_MS);
  const [byEmail, byIp] = await Promise.all([
    db.loginAttempt.count({ where: { email, success: false, created_at: { gte: since } } }),
    ip
      ? db.loginAttempt.count({ where: { ip, success: false, created_at: { gte: since } } })
      : Promise.resolve(0),
  ]);
  return byEmail >= MAX_FAILS_PER_EMAIL || byIp >= MAX_FAILS_PER_IP;
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  const keep = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) return { ...fromZodError(parsed.error), values: keep };

  const email = parsed.data.email.toLowerCase();
  const ip = await clientIp();

  if (await tooManyAttempts(email, ip)) {
    return {
      ok: false,
      message: "Muitas tentativas. Aguarde 15 minutos e tente de novo.",
      values: keep,
    };
  }

  const user = await db.user.findUnique({ where: { email } });
  // Sempre compara uma senha, mesmo sem usuário, para o tempo de resposta não revelar contas.
  const valid = await verifyPassword(parsed.data.password, user?.password_hash ?? DUMMY_HASH);

  await db.loginAttempt.create({ data: { email, ip, success: Boolean(user && valid) } });
  if (!user || !valid) return { ok: false, message: "E-mail ou senha incorretos.", values: keep };

  await createSession(user.id);
  redirect(safeNextPath(formData.get("proximo")));
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  const keep = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) return { ...fromZodError(parsed.error), values: keep };

  const email = parsed.data.email.toLowerCase();
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return { ok: false, message: "Já existe uma conta com este e-mail.", values: keep };
  }

  const user = await db.user.create({
    data: { email, password_hash: await hashPassword(parsed.data.password) },
    select: { id: true },
  });

  await createSession(user.id);
  redirect("/painel/boas-vindas");
}

export async function signOut() {
  await destroySession();
  redirect("/entrar");
}

export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  const keep = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) return { ...fromZodError(parsed.error), values: keep };

  const email = parsed.data.email.toLowerCase();
  const ip = await clientIp();
  // Reaproveita o limite de tentativas: evita usar o formulário para disparar e-mails em massa.
  if (await tooManyAttempts(`reset:${email}`, ip)) {
    return {
      ok: false,
      message: "Muitas tentativas. Aguarde 15 minutos e tente de novo.",
      values: keep,
    };
  }
  await db.loginAttempt.create({ data: { email: `reset:${email}`, ip, success: false } });

  await sendPasswordResetLink(email);
  // Mesma resposta exista a conta ou não.
  return {
    ok: true,
    message: "Se este e-mail estiver cadastrado, enviamos um link para escolher uma nova senha.",
  };
}

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const userId = await findUserByResetToken(parsed.data.token);
  if (!userId) {
    return { ok: false, message: "Este link expirou ou já foi usado. Peça um novo." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { password_hash: passwordHash } }),
    // Link de uso único e logout em todos os aparelhos.
    db.passwordResetToken.deleteMany({ where: { user_id: userId } }),
    db.session.deleteMany({ where: { user_id: userId } }),
  ]);

  redirect("/entrar?senha=alterada");
}
