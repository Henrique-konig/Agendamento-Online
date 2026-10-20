import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/features/auth/schemas";
import { createClient } from "@/lib/supabase/server";

/** Destino dos links enviados por e-mail (confirmação de conta, magic link, PKCE). */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNextPath(searchParams.get("proximo"));
  const supabase = await createClient();

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : { error: new Error("Link inválido") };

  const destination = error ? "/entrar?erro=link-invalido" : next;
  return NextResponse.redirect(new URL(destination, request.url));
}
