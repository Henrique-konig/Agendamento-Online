import "server-only";
import { db } from "@/lib/db";
import type { Interval } from "@/lib/scheduling/slots";
import { googleBusySource } from "@/features/google/busy-source";
import { ACTIVE_STATUSES } from "./policy";

export type BusyRange = {
  professionalId: string;
  from: Date;
  to: Date;
  /** Agendamento ignorado no cálculo (ao remarcar, o próprio horário não conta como ocupado). */
  excludeAppointmentId?: string;
};

/**
 * Fonte de horários ocupados. Novas integrações (ex.: Google Agenda) entram
 * como fontes adicionais sem alterar o cálculo de horários.
 */
export type BusySource = (range: BusyRange) => Promise<Interval[]>;

export const appointmentsSource: BusySource = async ({
  professionalId,
  from,
  to,
  excludeAppointmentId,
}) => {
  const rows = await db.appointment.findMany({
    where: {
      professional_id: professionalId,
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      status: { in: [...ACTIVE_STATUSES] },
      starts_at: { lt: to },
      ends_at: { gt: from },
    },
    select: { starts_at: true, ends_at: true },
  });
  return rows.map((a) => ({ start: a.starts_at, end: a.ends_at }));
};

export const timeOffSource: BusySource = async ({ professionalId, from, to }) => {
  const rows = await db.timeOff.findMany({
    where: { professional_id: professionalId, starts_at: { lt: to }, ends_at: { gt: from } },
    select: { starts_at: true, ends_at: true },
  });
  return rows.map((t) => ({ start: t.starts_at, end: t.ends_at }));
};

export const busySources: BusySource[] = [appointmentsSource, timeOffSource, googleBusySource];

export async function collectBusy(range: BusyRange) {
  const results = await Promise.all(busySources.map((source) => source(range)));
  return results.flat();
}
