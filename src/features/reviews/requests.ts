import "server-only";
import { db } from "@/lib/db";
import { sendReviewRequest } from "@/features/notifications/dispatch";
import { REVIEW_REQUEST_MAX_HOURS, REVIEW_REQUEST_MIN_HOURS } from "./policy";

const HOUR = 3_600_000;

export type ReviewRequestResult = { checked: number; sent: number; failed: number };

/**
 * Executado pelo agendador: pede avaliação de quem foi atendido há 3–48 horas
 * (concluído, ou confirmado que já passou), tem e-mail, ainda não avaliou e
 * cujo profissional não desligou o pedido. Cada agendamento é reivindicado
 * (review_requested_at) antes do envio, então execuções concorrentes não duplicam.
 */
export async function runReviewRequests(now = new Date()): Promise<ReviewRequestResult> {
  const rows = await db.appointment.findMany({
    where: {
      status: { in: ["completed", "confirmed"] },
      review_requested_at: null,
      review: { is: null },
      ends_at: {
        lte: new Date(now.getTime() - REVIEW_REQUEST_MIN_HOURS * HOUR),
        gte: new Date(now.getTime() - REVIEW_REQUEST_MAX_HOURS * HOUR),
      },
      client: { email: { not: null } },
      professional: { ask_reviews: true },
    },
    select: { id: true },
    take: 500,
  });

  let sent = 0;
  let failed = 0;
  for (const appointment of rows) {
    const claimed = await db.appointment.updateMany({
      where: { id: appointment.id, review_requested_at: null },
      data: { review_requested_at: now },
    });
    if (claimed.count === 0) continue;

    try {
      await sendReviewRequest(appointment.id);
      sent++;
    } catch (error) {
      failed++;
      console.error("[avaliacoes] falha no pedido", appointment.id, error);
    }
  }
  return { checked: rows.length, sent, failed };
}
