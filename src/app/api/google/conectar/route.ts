import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { googleConfig } from "@/features/google/config";
import { getUser } from "@/lib/auth";
import { buildAuthUrl } from "@/lib/google/oauth";

const STATE_COOKIE = "google_oauth_state";

/** Inicia o OAuth do Google para o profissional logado. */
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user)
    return NextResponse.redirect(new URL("/entrar?proximo=/painel/integracoes", request.url));

  const config = googleConfig();
  if (!config)
    return NextResponse.redirect(new URL("/painel/integracoes?google=indisponivel", request.url));

  // O state amarra o retorno a este navegador e a este usuário (proteção CSRF).
  const state = `${user.id}.${randomBytes(24).toString("base64url")}`;
  const response = NextResponse.redirect(
    buildAuthUrl({
      clientId: config.credentials.clientId,
      redirectUri: config.redirectUri,
      state,
      loginHint: user.email,
    }),
  );
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/api/google",
    maxAge: 600,
  });
  return response;
}
