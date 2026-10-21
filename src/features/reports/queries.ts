import "server-only";
import { db } from "@/lib/db";
import { computeReport, type Report, type ReportAppointment } from "./compute";

export const REPORT_PERIODS = [30, 90, 365] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

const DAY = 86_400_000;
/** Quem não volta há tanto tempo é "cliente para reativar". */
export const LAPSED_AFTER_DAYS = 60;

async function load(professionalId: string, from: Date, to: Date): Promise<ReportAppointment[]> {
  return db.appointment.findMany({
    where: { professional_id: professionalId, starts_at: { gte: from, lt: to } },
    select: {
      starts_at: true,
      ends_at: true,
      status: true,
      price_cents: true,
      service_name: true,
      source: true,
    },
    take: 20_000,
  });
}

export type LapsedClient = {
  id: string;
  name: string;
  phone: string;
  lastVisit: Date;
  visits: number;
};

/** Clientes com atendimento realizado cuja última visita foi há mais de 60 dias. */
async function lapsedClients(professionalId: string, now: Date): Promise<LapsedClient[]> {
  const cutoff = new Date(now.getTime() - LAPSED_AFTER_DAYS * DAY);
  const groups = await db.appointment.groupBy({
    by: ["client_id"],
    where: { professional_id: professionalId, status: { in: ["completed", "confirmed"] } },
    _max: { starts_at: true },
    _count: { _all: true },
    having: { starts_at: { _max: { lt: cutoff } } },
    orderBy: { _max: { starts_at: "desc" } },
    take: 10,
  });
  if (!groups.length) return [];

  const clients = await db.client.findMany({
    where: { id: { in: groups.map((g) => g.client_id) }, professional_id: professionalId },
    select: { id: true, name: true, phone: true },
  });
  const byId = new Map(clients.map((c) => [c.id, c]));
  return groups.flatMap((g) => {
    const client = byId.get(g.client_id);
    if (!client || !g._max.starts_at) return [];
    return [{ ...client, lastVisit: g._max.starts_at, visits: g._count._all }];
  });
}

export async function getReport(
  professionalId: string,
  timeZone: string,
  days: ReportPeriod,
  now = new Date(),
): Promise<{ current: Report; previous: Report; lapsed: LapsedClient[] }> {
  const since = new Date(now.getTime() - days * DAY);
  const before = new Date(since.getTime() - days * DAY);
  const [currentRows, previousRows, lapsed] = await Promise.all([
    load(professionalId, since, now),
    load(professionalId, before, since),
    lapsedClients(professionalId, now),
  ]);
  return {
    current: computeReport(currentRows, timeZone, now),
    previous: computeReport(previousRows, timeZone, now),
    lapsed,
  };
}
