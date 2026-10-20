"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { deleteBlob } from "@/lib/blob";
import { db } from "@/lib/db";
import { isOwnMediaUrl } from "@/lib/storage";
import { MAX_PHOTOS } from "./constants";

function revalidate(slug: string) {
  revalidatePath(`/${slug}`);
  revalidatePath("/painel/fotos");
}

export async function addPhoto(url: string): Promise<ActionState & { id?: string }> {
  const professional = await requireProfessional();
  if (!isOwnMediaUrl(url, professional.id)) return { ok: false, message: "Imagem inválida." };

  const count = await db.photo.count({ where: { professional_id: professional.id } });
  if (count >= MAX_PHOTOS) {
    await deleteBlob(url);
    return { ok: false, message: `Limite de ${MAX_PHOTOS} fotos atingido.` };
  }

  const photo = await db.photo.create({
    data: { professional_id: professional.id, image_url: url, position: count },
    select: { id: true },
  });

  revalidate(professional.slug);
  return { ok: true, id: photo.id };
}

export async function updatePhotoCaption(id: string, caption: string): Promise<ActionState> {
  const professional = await requireProfessional();
  const parsed = z
    .object({ id: z.uuid(), caption: z.string().trim().max(140) })
    .safeParse({ id, caption });
  if (!parsed.success) return { ok: false, message: "Legenda inválida." };

  await db.photo.updateMany({
    where: { id: parsed.data.id, professional_id: professional.id },
    data: { caption: parsed.data.caption || null },
  });

  revalidate(professional.slug);
  return { ok: true };
}

export async function deletePhoto(id: string): Promise<ActionState> {
  const professional = await requireProfessional();
  if (!z.uuid().safeParse(id).success) return { ok: false };

  const photo = await db.photo.findFirst({ where: { id, professional_id: professional.id } });
  if (photo) {
    await db.photo.delete({ where: { id: photo.id } });
    await deleteBlob(photo.image_url);
  }
  revalidate(professional.slug);
  return { ok: true };
}
