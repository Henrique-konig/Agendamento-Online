import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { googleConfig } from "@/features/google/config";
import { getUser } from "@/lib/auth";
import { encrypt } from "@/lib/crypto/secretbox";
import { emailFromIdToken, exchangeCode, hasCalendarScopes } from "@/lib/google/oauth";
import { createAdminClient } from "@/lib/supabase/admin";

const STATE_COOKIE = "google_oauth_state";

function sameState(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function GET(request: NextRequest) {
  const back = (status: string) => {
    const response = NextResponse.redirect(
      new URL(`/painel/integracoes?google=${status}`, request.url),
    );
    response.cookies.delete({ name: STATE_COOKIE, path: "/api/google" });
    return response;
  };

  const { searchParams } = request.nextUrl;
  const state = searchParams.get("state") ?? "";
  const expected = request.cookies.get(STATE_COOKIE)?.value ?? "";
  const user = await getUser();
  const config = googleConfig();

  if (!user || !config) return back("erro");
  if (!state || !expected || !sameState(state, expected) || !state.startsWith(`${user.id}.`)) {
    return back("erro");
  }
  if (searchParams.get("error")) return back("cancelado");

  const code = searchParams.get("code");
  if (!code) return back("erro");

  try {
    const tokens = await exchangeCode(code, config.redirectUri, config.credentials);
    if (!hasCalendarScopes(tokens.scope)) return back("permissoes");
    if (!tokens.refresh_token) return back("erro");

    const admin = createAdminClient();
    const { error } = await admin.from("google_connections").upsert({
      professional_id: user.id,
      google_email: emailFromIdToken(tokens.id_token),
      refresh_token_enc: encrypt(tokens.refresh_token, config.encryptionKey),
      access_token_enc: encrypt(tokens.access_token, config.encryptionKey),
      access_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      last_error: null,
      last_error_at: null,
    });
    if (error) throw error;
    return back("conectado");
  } catch (e) {
    console.error("[google] callback", e);
    return back("erro");
  }
}
