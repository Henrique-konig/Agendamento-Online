"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { emailField } from "@/features/booking/schemas";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  const { error } = await supabase
    .from("professionals")
    .update(parsed.data)
    .eq("id", professional.id);
  if (error) return { ok: false, message: "Não foi possível salvar." };

  revalidatePath("/painel/notificacoes");
  return { ok: true, message: "Preferências salvas." };
}
