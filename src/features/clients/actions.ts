"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update(data)
    .eq("id", id)
    .eq("professional_id", professional.id);
  if (error) return { ok: false, message: "Não foi possível salvar." };

  revalidatePath(`/painel/clientes/${id}`);
  return { ok: true, message: "Cliente atualizado." };
}
