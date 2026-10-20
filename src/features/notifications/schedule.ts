import { addDays, instantToLocalDate } from "@/lib/scheduling/time";

type Candidate = { id: string; starts_at: string; timezone: string };

/**
 * Lembretes vencidos: agendamentos cuja data local (no fuso do profissional)
 * é amanhã. Funciona com qualquer frequência de execução do agendador —
 * a idempotência é garantida por `reminder_sent_at`.
 */
export function isDueForReminder(candidate: Candidate, now: Date) {
  const tomorrow = addDays(instantToLocalDate(now, candidate.timezone), 1);
  return instantToLocalDate(new Date(candidate.starts_at), candidate.timezone) === tomorrow;
}
