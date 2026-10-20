import { NextResponse } from "next/server";
import { supabasePublicKey } from "@/lib/env";

export const dynamic = "force-dynamic";

/** TEMPORÁRIO: mostra qual projeto Supabase o servidor está usando (sem expor segredos). */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const publicKey = supabasePublicKey() ?? "";
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const kind = (key: string) =>
    !key
      ? "ausente"
      : key.startsWith("sb_publishable_")
        ? "sb_publishable"
        : key.startsWith("sb_secret_")
          ? "sb_secret"
          : key.startsWith("eyJ")
            ? "jwt-legado"
            : "desconhecida";

  let tabela: string | number = "sem url";
  if (url && publicKey) {
    try {
      const response = await fetch(`${url}/rest/v1/professionals?select=id&limit=1`, {
        headers: { apikey: publicKey, Authorization: `Bearer ${publicKey}` },
        cache: "no-store",
      });
      tabela =
        response.status === 200
          ? "existe"
          : `${response.status} ${(await response.text()).slice(0, 120)}`;
    } catch (e) {
      tabela = `falha: ${e instanceof Error ? e.message : e}`;
    }
  }

  return NextResponse.json({
    projeto: url ? new URL(url).hostname : "ausente",
    chavePublica: kind(publicKey),
    chaveSecreta: kind(secretKey),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "ausente",
    tabelaProfessionals: tabela,
  });
}
