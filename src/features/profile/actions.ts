"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { isOwnMediaPath, MEDIA_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "./schemas";

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const professional = await requireProfessional();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("professionals")
    .update(parsed.data)
    .eq("id", professional.id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, fieldErrors: { slug: ["Este endereço já está em uso."] } };
    }
    if (error.code === "23514") {
      return { ok: false, message: "Algum campo tem um valor inválido. Revise e tente novamente." };
    }
    return { ok: false, message: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath(`/${professional.slug}`);
  if (parsed.data.slug !== professional.slug) revalidatePath(`/${parsed.data.slug}`);
  revalidatePath("/painel", "layout");
  return { ok: true, message: "Perfil atualizado." };
}

const imageSchema = z.object({
  kind: z.enum(["avatar", "cover"]),
  path: z.string().min(1).nullable(),
});

/** Define (ou remove, com path null) a foto de perfil ou a capa. */
export async function setProfileImage(input: z.input<typeof imageSchema>): Promise<ActionState> {
  const professional = await requireProfessional();
  const parsed = imageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Imagem inválida." };

  const { kind, path } = parsed.data;
  if (path && !isOwnMediaPath(path, professional.id))
    return { ok: false, message: "Imagem inválida." };

  const column = kind === "avatar" ? "avatar_path" : "cover_path";
  const previous = professional[column];
  const update = kind === "avatar" ? { avatar_path: path } : { cover_path: path };

  const supabase = await createClient();
  const { error } = await supabase.from("professionals").update(update).eq("id", professional.id);
  if (error) return { ok: false, message: "Não foi possível salvar a imagem." };

  if (previous && previous !== path) {
    await supabase.storage.from(MEDIA_BUCKET).remove([previous]);
  }

  revalidatePath(`/${professional.slug}`);
  revalidatePath("/painel/perfil");
  return { ok: true };
}
