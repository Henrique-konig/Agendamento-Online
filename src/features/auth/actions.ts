"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { DUMMY_HASH, hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { safeNextPath, signInSchema, signUpSchema } from "./schemas";

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
  if (!parsed.success) return fromZodError(parsed.error);

  const email = parsed.data.email.toLowerCase();
  const ip = await clientIp();

  if (await tooManyAttempts(email, ip)) {
    return { ok: false, message: "Muitas tentativas. Aguarde 15 minutos e tente de novo." };
  }

  const user = await db.user.findUnique({ where: { email } });
  // Sempre compara uma senha, mesmo sem usuário, para o tempo de resposta não revelar contas.
  const valid = await verifyPassword(parsed.data.password, user?.password_hash ?? DUMMY_HASH);

  await db.loginAttempt.create({ data: { email, ip, success: Boolean(user && valid) } });
  if (!user || !valid) return { ok: false, message: "E-mail ou senha incorretos." };

  await createSession(user.id);
  redirect(safeNextPath(formData.get("proximo")));
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const email = parsed.data.email.toLowerCase();
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return { ok: false, message: "Já existe uma conta com este e-mail." };
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
