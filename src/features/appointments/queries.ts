import "server-only";
import { db } from "@/lib/db";

export function listAppointments(professionalId: string, from: Date, to: Date) {
  return db.appointment.findMany({
    where: { professional_id: professionalId, starts_at: { gte: from, lt: to } },
    orderBy: { starts_at: "asc" },
    select: {
      id: true,
      starts_at: true,
      ends_at: true,
      status: true,
      service_name: true,
      price_cents: true,
      notes: true,
      source: true,
      payment_status: true,
      payment_amount_cents: true,
      payment_provider: true,
      client: { select: { id: true, name: true, phone: true } },
    },
  });
}

export type AppointmentListItem = Awaited<ReturnType<typeof listAppointments>>[number];
