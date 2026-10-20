"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { db } from "@/lib/db";
import { emailField } from "@/features/booking/schemas";
import { optionalText } from "@/lib/validation/fields";

const clientSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  email: emailField,
  notes: optionalText(2000),
});

export async function updateClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const professional = await requireProfessional();
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const { id, ...data } = parsed.data;
  try {
    await db.client.updateMany({ where: { id, professional_id: professional.id }, data });
  } catch (error) {
    console.error("[clients] falha ao salvar", error);
    return { ok: false, message: "Não foi possível salvar." };
  }

  revalidatePath(`/painel/clientes/${id}`);
  return { ok: true, message: "Cliente atualizado." };
}
