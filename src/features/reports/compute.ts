export type ReportAppointment = {
  starts_at: Date;
  ends_at: Date;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  price_cents: number | null;
  service_name: string;
  source: string;
};

export type ServiceStat = { name: string; count: number; revenueCents: number };

export type Report = {
  total: number;
  /** Atendimentos que de fato aconteceram: concluídos, ou confirmados cujo horário já passou. */
  realized: number;
  cancelled: number;
  noShow: number;
  /** Faltas sobre (realizados + faltas); null sem base de cálculo. */
  noShowRate: number | null;
  cancelRate: number | null;
  /** Soma do preço dos atendimentos realizados (serviços sem preço contam 0). */
  revenueCents: number;
  /** Atendimentos não cancelados por dia da semana (0 = domingo) e por hora local. */
  byWeekday: number[];
  byHour: { hour: number; count: number }[];
  services: ServiceStat[];
  onlineShare: number | null;
};

const isActive = (a: ReportAppointment) => a.status !== "cancelled";

/** Dia da semana (0-6, domingo = 0) e hora (0-23) de um instante no fuso informado. */
export function localWeekdayAndHour(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(instant);
  const weekdayName = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekdayName);
  return { weekday: Math.max(weekday, 0), hour };
}

export function computeReport(
  appointments: ReportAppointment[],
  timeZone: string,
  now = new Date(),
): Report {
  const realizedOf = (a: ReportAppointment) =>
    a.status === "completed" || (a.status === "confirmed" && a.ends_at.getTime() <= now.getTime());

  const byWeekday = [0, 0, 0, 0, 0, 0, 0];
  const hours = new Map<number, number>();
  const services = new Map<string, ServiceStat>();
  let realized = 0;
  let cancelled = 0;
  let noShow = 0;
  let revenueCents = 0;
  let online = 0;
  let activeCount = 0;

  for (const a of appointments) {
    if (a.status === "cancelled") cancelled++;
    if (a.status === "no_show") noShow++;
    if (!isActive(a)) continue;

    activeCount++;
    if (a.source === "online") online++;
    const { weekday, hour } = localWeekdayAndHour(a.starts_at, timeZone);
    byWeekday[weekday]++;
    hours.set(hour, (hours.get(hour) ?? 0) + 1);

    const stat = services.get(a.service_name) ?? {
      name: a.service_name,
      count: 0,
      revenueCents: 0,
    };
    stat.count++;
    if (realizedOf(a)) stat.revenueCents += a.price_cents ?? 0;
    services.set(a.service_name, stat);

    if (realizedOf(a)) {
      realized++;
      revenueCents += a.price_cents ?? 0;
    }
  }

  const attended = realized + noShow;
  return {
    total: appointments.length,
    realized,
    cancelled,
    noShow,
    noShowRate: attended ? noShow / attended : null,
    cancelRate: appointments.length ? cancelled / appointments.length : null,
    revenueCents,
    byWeekday,
    byHour: [...hours.entries()]
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour),
    services: [...services.values()].sort(
      (a, b) => b.count - a.count || b.revenueCents - a.revenueCents,
    ),
    onlineShare: activeCount ? online / activeCount : null,
  };
}

/** Variação percentual entre períodos; null quando o anterior é zero (não há base). */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return (current - previous) / previous;
}
