import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { emitBookingEvent } from "@/features/booking/notify";
import { runReminders } from "@/features/notifications/reminders";
import { expireUnpaid } from "@/features/payments/expire";
import { integrationsEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: NextRequest) {
  const secret = integrationsEnv().CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * Chamado pelo Vercel Cron (veja vercel.json): libera reservas com Pix vencido
 * e envia os lembretes do dia seguinte.
 */
export async function GET(request: NextRequest) {
  let allowed: boolean;
  try {
    allowed = authorized(request);
  } catch (error) {
    // Variável de ambiente inválida: sem autenticar o chamador, o detalhe fica só no log.
    console.error("[cron] configuração inválida", error);
    return NextResponse.json({ error: "Configuração inválida" }, { status: 500 });
  }
  if (!allowed) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const expired = await expireUnpaid();
    await Promise.all(
      expired.map((id) => emitBookingEvent({ type: "cancelled", appointmentId: id })),
    );

    const result = await runReminders();
    return NextResponse.json({ ...result, expiredPayments: expired.length });
  } catch (error) {
    // Só chega aqui quem enviou o segredo, então o motivo pode ir na resposta.
    console.error("[cron] falha ao executar lembretes", error);
    return NextResponse.json(
      {
        error: "Falha ao executar",
        detalhe: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
