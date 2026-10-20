"use server";

import { redirect } from "next/navigation";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { siteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath, signInSchema, signUpSchema } from "./schemas";

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return {
      ok: false,
      message:
        error.code === "email_not_confirmed"
          ? "Confirme seu e-mail antes de entrar."
          : "E-mail ou senha incorretos.",
    };
  }

  redirect(safeNextPath(formData.get("proximo")));
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: siteUrl("/auth/confirmar?proximo=/painel/boas-vindas") },
  });

  if (error) {
    return {
      ok: false,
      message:
        error.code === "user_already_exists"
          ? "Já existe uma conta com este e-mail."
          : "Não foi possível criar a conta. Tente novamente.",
    };
  }

  // Projetos sem confirmação de e-mail já retornam uma sessão.
  if (data.session) redirect("/painel/boas-vindas");

  return { ok: true, message: "Enviamos um link de confirmação para o seu e-mail." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}
