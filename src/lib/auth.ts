import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

/** Usuário autenticado da requisição atual. */
export const getUser = getSessionUser;

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/entrar");
  return user;
}

/** Profissional do usuário logado, ou null se ainda não concluiu o cadastro. */
export const getCurrentProfessional = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  return db.professional.findUnique({ where: { id: user.id } });
});

export async function requireProfessional() {
  await requireUser();
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/painel/boas-vindas");
  return professional;
}
