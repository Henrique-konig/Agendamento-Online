/**
 * Limpa o BLOB_READ_WRITE_TOKEN colado no painel: remove aspas, espaços e o
 * prefixo "NOME=" que costumam vir junto ao copiar do .env.local.
 */
export function normalizeBlobToken(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let value = raw.trim();
  value = value.replace(/^BLOB_READ_WRITE_TOKEN\s*=\s*/, "").trim();
  value = value.replace(/^["']|["']$/g, "").trim();
  return value || undefined;
}

/** Formato esperado: vercel_blob_rw_<idDaLoja>_<segredo>. */
export function isValidBlobToken(token: string): boolean {
  const [vercel, blob, rw, storeId, secret] = token.split("_");
  return vercel === "vercel" && blob === "blob" && rw === "rw" && !!storeId && !!secret;
}

/** Descreve o formato sem revelar o segredo (seguro para o log). */
export function describeBlobToken(token: string | undefined): string {
  if (!token) return "ausente";
  const parts = token.split("_");
  return `tamanho=${token.length} partes=${parts.length} inicio=${parts.slice(0, 4).join("_").slice(0, 30)}`;
}
