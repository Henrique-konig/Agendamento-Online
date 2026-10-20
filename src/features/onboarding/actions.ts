"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { db } from "@/lib/db";
import { isPgError, PG } from "@/lib/db-errors";
import { onboardingSchema } from "./schemas";

export async function completeOnboarding(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  try {
    await db.professional.create({ data: { id: user.id, ...parsed.data } });
  } catch (error) {
    if (isPgError(error, PG.UNIQUE)) {
      return { ok: false, fieldErrors: { slug: ["Este endereço já está em uso."] } };
    }
    if (isPgError(error, PG.CHECK)) {
      return { ok: false, fieldErrors: { slug: ["Este endereço não está disponível."] } };
    }
    console.error("[onboarding] falha ao criar profissional", error);
    return { ok: false, message: "Não foi possível salvar. Tente novamente." };
  }

  redirect("/painel");
}
