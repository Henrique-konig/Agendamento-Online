import "server-only";
import { appointmentLocation } from "@/features/booking/event";
import { siteUrl } from "@/lib/env";
import { formatPhoneBR } from "@/lib/format/contact";
import { deleteEvent, insertEvent } from "@/lib/google/calendar";
import { createAdminClient } from "@/lib/supabase/admin";
import { withGoogle } from "./connection";

/** Cria o evento na Google Agenda do profissional para um novo agendamento. */
export async function pushAppointmentToGoogle(appointmentId: string) {
  const admin = createAdminClient();
  const { data: a } = await admin
    .from("appointments")
    .select("*, client:clients(name, phone, email), professional:professionals(*)")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!a?.professional || !a.client || a.google_event_id) return;
  if (a.status !== "confirmed" && a.status !== "pending") return;

  const eventId = await withGoogle(
    admin,
    a.professional_id,
    ({ accessToken, connection }) =>
      insertEvent(accessToken, connection.calendar_id, {
        summary: `${a.service_name} — ${a.client!.name}`,
        description: [
          `Cliente: ${a.client!.name}`,
          `WhatsApp: ${formatPhoneBR(a.client!.phone)}`,
          a.client!.email ? `E-mail: ${a.client!.email}` : null,
          a.notes ? `Observações: ${a.notes}` : null,
          "",
          `Gerenciar: ${siteUrl("/painel/agenda")}`,
        ]
          .filter((line) => line !== null)
          .join("\n"),
        location: appointmentLocation(a.professional!),
        start: new Date(a.starts_at),
        end: new Date(a.ends_at),
        privateId: a.id,
      }),
    { when: (c) => c.create_events },
  );

  if (eventId) {
    await admin.from("appointments").update({ google_event_id: eventId }).eq("id", a.id);
  }
}

/** Remove da Google Agenda o evento de um agendamento cancelado. */
export async function removeAppointmentFromGoogle(appointmentId: string) {
  const admin = createAdminClient();
  const { data: a } = await admin
    .from("appointments")
    .select("id, professional_id, google_event_id")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!a?.google_event_id) return;

  const removed = await withGoogle(
    admin,
    a.professional_id,
    async ({ accessToken, connection }) => {
      await deleteEvent(accessToken, connection.calendar_id, a.google_event_id!);
      return true;
    },
  );
  if (removed) {
    await admin.from("appointments").update({ google_event_id: null }).eq("id", a.id);
  }
}
