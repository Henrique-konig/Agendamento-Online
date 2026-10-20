"use client";

import { createClient } from "@/lib/supabase/client";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, MEDIA_BUCKET } from "@/lib/storage";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return "Envie uma imagem JPG, PNG ou WebP.";
  if (file.size > MAX_IMAGE_BYTES) return "A imagem deve ter no máximo 5 MB.";
  return null;
}

/** Envia a imagem para media/<professionalId>/<prefixo>-<uuid>.<ext> e retorna o caminho. */
export async function uploadImage(file: File, professionalId: string, prefix: string) {
  const error = validateImage(file);
  if (error) throw new Error(error);

  const path = `${professionalId}/${prefix}-${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
  const supabase = createClient();
  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });

  if (uploadError) throw new Error("Falha no envio da imagem. Tente novamente.");
  return path;
}
