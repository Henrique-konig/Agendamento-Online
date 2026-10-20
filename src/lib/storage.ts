export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/**
 * Garante que a URL é de um arquivo do Vercel Blob dentro da pasta do
 * profissional. Sem isso, alguém poderia gravar no perfil uma URL qualquer.
 */
export function isOwnMediaUrl(url: string, professionalId: string) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.endsWith(BLOB_HOST_SUFFIX) &&
      parsed.pathname.startsWith(`/${professionalId}/`) &&
      !parsed.pathname.includes("..")
    );
  } catch {
    return false;
  }
}
