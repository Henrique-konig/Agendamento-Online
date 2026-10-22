import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Saúde do serviço para monitores de disponibilidade (UptimeRobot, Better Stack...).
 * 200 = app no ar e banco respondendo; 503 = banco fora. Não expõe dados nem segredos.
 */
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    await db.$queryRaw`select 1`;
    return NextResponse.json(
      { status: "ok", commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null },
      { headers },
    );
  } catch (error) {
    console.error("[health] banco indisponível", error instanceof Error ? error.name : "erro");
    return NextResponse.json({ status: "degraded" }, { status: 503, headers });
  }
}
