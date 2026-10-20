import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("appointments")
    .select("id, starts_at, professional:professionals(timezone)")
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gt("starts_at", now.toISOString())
    .lt("starts_at", new Date(now.getTime() + 48 * 3600_000).toISOString())
    .limit(500);
  if (error) throw error;

  const due = data.filter(
    (a) => a.professional && isDueForReminder({ ...a, timezone: a.professional.timezone }, now),
  );

  let sent = 0;
  let failed = 0;
  for (const appointment of due) {
    const { data: claimed } = await admin
      .from("appointments")
      .update({ reminder_sent_at: now.toISOString() })
      .eq("id", appointment.id)
      .is("reminder_sent_at", null)
      .select("id")
      .maybeSingle();
    if (!claimed) continue;

    try {
      await sendReminder(admin, appointment.id);
      sent++;
    } catch (e) {
      failed++;
      console.error("[lembretes] falha", appointment.id, e);
    }
  }

  return { checked: data.length, sent, failed };
}
