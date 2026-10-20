export const MEDIA_BUCKET = "media";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** URL pública de um arquivo do bucket de mídia. */
export function publicMediaUrl(path: string | null | undefined) {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}

/** Garante que o caminho pertence à pasta do profissional (defesa extra além do RLS). */
export function isOwnMediaPath(path: string, professionalId: string) {
  return path.startsWith(`${professionalId}/`) && !path.includes("..");
}
