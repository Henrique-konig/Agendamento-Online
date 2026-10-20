"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { isOwnMediaPath, MEDIA_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { MAX_PHOTOS } from "./constants";

function revalidate(slug: string) {
  revalidatePath(`/${slug}`);
  revalidatePath("/painel/fotos");
}

export async function addPhoto(path: string): Promise<ActionState & { id?: string }> {
  const professional = await requireProfessional();
  if (!isOwnMediaPath(path, professional.id)) return { ok: false, message: "Imagem inválida." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("photos")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", professional.id);

  if ((count ?? 0) >= MAX_PHOTOS) {
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    return { ok: false, message: `Limite de ${MAX_PHOTOS} fotos atingido.` };
  }

  const { data, error } = await supabase
    .from("photos")
    .insert({ professional_id: professional.id, storage_path: path, position: count ?? 0 })
    .select("id")
    .single();
  if (error) return { ok: false, message: "Não foi possível salvar a foto." };

  revalidate(professional.slug);
  return { ok: true, id: data.id };
}

export async function updatePhotoCaption(id: string, caption: string): Promise<ActionState> {
  const professional = await requireProfessional();
  const parsed = z
    .object({ id: z.uuid(), caption: z.string().trim().max(140) })
    .safeParse({ id, caption });
  if (!parsed.success) return { ok: false, message: "Legenda inválida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("photos")
    .update({ caption: parsed.data.caption || null })
    .eq("id", parsed.data.id)
    .eq("professional_id", professional.id);
  if (error) return { ok: false, message: "Não foi possível salvar a legenda." };

  revalidate(professional.slug);
  return { ok: true };
}

export async function deletePhoto(id: string): Promise<ActionState> {
  const professional = await requireProfessional();
  if (!z.uuid().safeParse(id).success) return { ok: false };

  const supabase = await createClient();
  const { data } = await supabase
    .from("photos")
    .delete()
    .eq("id", id)
    .eq("professional_id", professional.id)
    .select("storage_path")
    .maybeSingle();

  if (data) await supabase.storage.from(MEDIA_BUCKET).remove([data.storage_path]);
  revalidate(professional.slug);
  return { ok: true };
}
