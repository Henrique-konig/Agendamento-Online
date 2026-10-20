import "server-only";
import { db } from "@/lib/db";
import { sendReminder } from "./dispatch";
import { isDueForReminder } from "./schedule";

export type ReminderRunResult = { checked: number; sent: number; failed: number };

/**
 * Executado pelo agendador. Busca agendamentos confirmados das próximas 48h
 * sem lembrete, filtra os de "amanhã" no fuso de cada profissional e
 * reivindica cada um (reminder_sent_at) antes de enviar — execuções
 * concorrentes nunca enviam em dobro.
 */
export async function runReminders(now = new Date()): Promise<ReminderRunResult> {
  const rows = await db.appointment.findMany({
    where: {
      status: "confirmed",
      reminder_sent_at: null,
      starts_at: { gt: now, lt: new Date(now.getTime() + 48 * 3600_000) },
    },
    select: { id: true, starts_at: true, professional: { select: { timezone: true } } },
    take: 500,
  });

  const due = rows.filter((a) =>
    isDueForReminder(
      { id: a.id, starts_at: a.starts_at.toISOString(), timezone: a.professional.timezone },
      now,
    ),
  );

  let sent = 0;
  let failed = 0;
  for (const appointment of due) {
    // Reivindica o envio: só quem muda reminder_sent_at de nulo para agora envia.
    const claimed = await db.appointment.updateMany({
      where: { id: appointment.id, reminder_sent_at: null },
      data: { reminder_sent_at: now },
    });
    if (claimed.count === 0) continue;

    try {
      await sendReminder(appointment.id);
      sent++;
    } catch (e) {
      failed++;
      console.error("[lembretes] falha", appointment.id, e);
    }
  }

  return { checked: rows.length, sent, failed };
}
