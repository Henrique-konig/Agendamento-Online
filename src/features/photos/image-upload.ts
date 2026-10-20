"use client";

import { upload } from "@vercel/blob/client";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/storage";

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

/** Envia a imagem direto ao Vercel Blob em <profissional>/<prefixo>.<ext> e devolve a URL pública. */
export async function uploadImage(file: File, professionalId: string, prefix: string) {
  const error = validateImage(file);
  if (error) throw new Error(error);

  try {
    const blob = await upload(`${professionalId}/${prefix}.${EXTENSIONS[file.type]}`, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
      contentType: file.type,
    });
    return blob.url;
  } catch {
    throw new Error("Falha no envio da imagem. Tente novamente.");
  }
}
