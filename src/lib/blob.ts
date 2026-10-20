import "server-only";
import { del } from "@vercel/blob";

/** Apaga um arquivo do Blob. Falhas não interrompem o fluxo (o arquivo vira órfão). */
export async function deleteBlob(url: string | null | undefined) {
  if (!url) return;
  try {
    await del(url);
  } catch (error) {
    console.error("[blob] falha ao apagar", url, error);
  }
}
