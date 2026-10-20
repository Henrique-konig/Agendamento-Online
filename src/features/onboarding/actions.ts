"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "./schemas";

export async function completeOnboarding(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("professionals").insert({ id: user.id, ...parsed.data });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, fieldErrors: { slug: ["Este endereço já está em uso."] } };
    }
    if (error.code === "23514") {
      return { ok: false, fieldErrors: { slug: ["Este endereço não está disponível."] } };
    }
    return { ok: false, message: "Não foi possível salvar. Tente novamente." };
  }

  redirect("/painel");
}
