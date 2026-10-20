"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { deleteBlob } from "@/lib/blob";
import { db } from "@/lib/db";
import { isPgError, PG } from "@/lib/db-errors";
import { isOwnMediaUrl } from "@/lib/storage";
import { profileSchema } from "./schemas";

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const professional = await requireProfessional();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  try {
    await db.professional.update({ where: { id: professional.id }, data: parsed.data });
  } catch (error) {
    if (isPgError(error, PG.UNIQUE)) {
      return { ok: false, fieldErrors: { slug: ["Este endereço já está em uso."] } };
    }
    if (isPgError(error, PG.CHECK)) {
      return { ok: false, message: "Algum campo tem um valor inválido. Revise e tente novamente." };
    }
    console.error("[profile] falha ao salvar", error);
    return { ok: false, message: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath(`/${professional.slug}`);
  if (parsed.data.slug !== professional.slug) revalidatePath(`/${parsed.data.slug}`);
  revalidatePath("/painel", "layout");
  return { ok: true, message: "Perfil atualizado." };
}

const imageSchema = z.object({
  kind: z.enum(["avatar", "cover"]),
  url: z.string().min(1).nullable(),
});

/** Define (ou remove, com url null) a foto de perfil ou a capa. */
export async function setProfileImage(input: z.input<typeof imageSchema>): Promise<ActionState> {
  const professional = await requireProfessional();
  const parsed = imageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Imagem inválida." };

  const { kind, url } = parsed.data;
  if (url && !isOwnMediaUrl(url, professional.id))
    return { ok: false, message: "Imagem inválida." };

  const previous = kind === "avatar" ? professional.avatar_url : professional.cover_url;
  await db.professional.update({
    where: { id: professional.id },
    data: kind === "avatar" ? { avatar_url: url } : { cover_url: url },
  });

  if (previous && previous !== url) await deleteBlob(previous);

  revalidatePath(`/${professional.slug}`);
  revalidatePath("/painel/perfil");
  return { ok: true };
}
