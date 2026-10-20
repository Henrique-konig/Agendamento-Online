import "server-only";
import { appointmentLocation } from "@/features/booking/event";
import { siteUrl } from "@/lib/env";
import { formatPhoneBR } from "@/lib/format/contact";
import { deleteEvent, insertEvent } from "@/lib/google/calendar";
import { db } from "@/lib/db";
import { withGoogle } from "./connection";

/** Cria o evento na Google Agenda do profissional para um novo agendamento. */
export async function pushAppointmentToGoogle(appointmentId: string) {
  const a = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { client: true, professional: true },
  });
  if (!a || a.google_event_id) return;
  if (a.status !== "confirmed" && a.status !== "pending") return;

  const eventId = await withGoogle(
    a.professional_id,
    ({ accessToken, connection }) =>
      insertEvent(accessToken, connection.calendar_id, {
        summary: `${a.service_name} — ${a.client.name}`,
        description: [
          `Cliente: ${a.client.name}`,
          `WhatsApp: ${formatPhoneBR(a.client.phone)}`,
          a.client.email ? `E-mail: ${a.client.email}` : null,
          a.notes ? `Observações: ${a.notes}` : null,
          "",
          `Gerenciar: ${siteUrl("/painel/agenda")}`,
        ]
          .filter((line) => line !== null)
          .join("\n"),
        location: appointmentLocation(a.professional),
        start: a.starts_at,
        end: a.ends_at,
        privateId: a.id,
      }),
    { when: (c) => c.create_events },
  );

  if (eventId) {
    await db.appointment.update({ where: { id: a.id }, data: { google_event_id: eventId } });
  }
}

/** Remove da Google Agenda o evento de um agendamento cancelado. */
export async function removeAppointmentFromGoogle(appointmentId: string) {
  const a = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, professional_id: true, google_event_id: true },
  });
  if (!a?.google_event_id) return;
  const eventId = a.google_event_id;

  const removed = await withGoogle(a.professional_id, async ({ accessToken, connection }) => {
    await deleteEvent(accessToken, connection.calendar_id, eventId);
    return true;
  });
  if (removed) {
    await db.appointment.update({ where: { id: a.id }, data: { google_event_id: null } });
  }
}
