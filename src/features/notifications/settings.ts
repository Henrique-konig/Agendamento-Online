"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { emailField } from "@/features/booking/schemas";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkbox } from "@/lib/validation/fields";

const schema = z.object({
  notification_email: emailField,
  notify_new_booking: checkbox,
  reminder_email: checkbox,
  reminder_whatsapp: checkbox,
});

export async function saveNotificationSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const professional = await requireProfessional();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  try {
    await db.professional.update({ where: { id: professional.id }, data: parsed.data });
  } catch (error) {
    console.error("[notificacoes] falha ao salvar", error);
    return { ok: false, message: "Não foi possível salvar." };
  }

  revalidatePath("/painel/notificacoes");
  return { ok: true, message: "Preferências salvas." };
}
