import { db } from "@/lib/db";

const WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

/** Envios que falharam nos últimos dias, para avisar o profissional no painel. */
export async function recentNotificationFailures(professionalId: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  const where = {
    professional_id: professionalId,
    status: "failed" as const,
    created_at: { gte: since },
  };
  const [count, latest] = await Promise.all([
    db.notificationLog.count({ where }),
    db.notificationLog.findFirst({
      where,
      orderBy: { created_at: "desc" },
      select: { error: true },
    }),
  ]);
  return { count, lastError: latest?.error ?? null };
}
