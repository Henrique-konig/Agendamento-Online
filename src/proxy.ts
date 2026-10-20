import { NextResponse, type NextRequest } from "next/server";

/**
 * Barreira leve: sem cookie de sessão, o painel nem renderiza. A validação
 * real da sessão (banco) acontece nas páginas e nas Server Actions.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    url.searchParams.set("proximo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/painel/:path*"],
};
