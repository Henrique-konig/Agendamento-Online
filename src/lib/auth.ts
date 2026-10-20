import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Usuário autenticado da requisição atual (deduplicado por render). */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/entrar");
  return user;
}

/** Profissional do usuário logado, ou null se ainda não concluiu o cadastro. */
export const getCurrentProfessional = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("professionals").select("*").eq("id", user.id).maybeSingle();
  return data;
});

export async function requireProfessional() {
  await requireUser();
  const professional = await getCurrentProfessional();
  if (!professional) redirect("/painel/boas-vindas");
  return professional;
}
