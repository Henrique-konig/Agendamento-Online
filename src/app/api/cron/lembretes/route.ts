import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { emitBookingEvent } from "@/features/booking/notify";
import { runReminders } from "@/features/notifications/reminders";
import { expireUnpaid } from "@/features/payments/expire";
import { createAdminClient } from "@/lib/supabase/admin";
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
  if (!authorized(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const expired = await expireUnpaid(createAdminClient());
  await Promise.all(
    expired.map((id) => emitBookingEvent({ type: "cancelled", appointmentId: id })),
  );

  const result = await runReminders();
  return NextResponse.json({ ...result, expiredPayments: expired.length });
}
