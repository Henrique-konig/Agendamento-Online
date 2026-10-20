import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabasePublicKey } from "@/lib/env";
import type { Database } from "@/types/database";

const PROTECTED_PREFIXES = ["/painel"];
const AUTH_PAGES = ["/entrar", "/cadastro"];

/** Renova a sessão do Supabase e protege as rotas do painel. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabasePublicKey();
  if (!url || !key) return response;

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Não coloque código entre a criação do cliente e getClaims().
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  if (!isLoggedIn && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/entrar";
    redirectUrl.searchParams.set("proximo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isLoggedIn && AUTH_PAGES.includes(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/painel";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
