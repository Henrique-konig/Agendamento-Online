import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentProfessional } from "@/lib/auth";
import { describeBlobToken, isValidBlobToken, normalizeBlobToken } from "@/lib/blob-token";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/storage";

/**
 * Autoriza o envio direto do navegador para o Vercel Blob. Só profissionais
 * logados enviam, e apenas para a própria pasta, com tipo e tamanho limitados.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  const professional = await getCurrentProfessional();

  const token = normalizeBlobToken(process.env.BLOB_READ_WRITE_TOKEN);

  try {
    if (token && !isValidBlobToken(token)) {
      console.error(
        "[upload] BLOB_READ_WRITE_TOKEN com formato inválido (esperado vercel_blob_rw_<loja>_<segredo>):",
        describeBlobToken(token),
      );
    }
    const result = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async (pathname) => {
        if (!professional) throw new Error("Não autorizado");
        if (!pathname.startsWith(`${professional.id}/`) || pathname.includes("..")) {
          throw new Error("Caminho inválido");
        }
        return {
          allowedContentTypes: ACCEPTED_IMAGE_TYPES,
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    // O motivo fica no log da Vercel (a resposta ao navegador é genérica de propósito).
    console.error("[upload] recusado", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha no envio" },
      { status: 400 },
    );
  }
}
