import { appointmentToCalendarEvent } from "@/features/booking/event";
import { getAppointmentByToken } from "@/features/booking/queries";
import { icsFile } from "@/lib/calendar/links";
import { siteUrl } from "@/lib/env";

export async function GET(_request: Request, ctx: RouteContext<"/api/agendamento/[token]/ics">) {
  const { token } = await ctx.params;
  const appointment = await getAppointmentByToken(token);
  if (!appointment?.professional) return new Response("Não encontrado", { status: 404 });

  const manageUrl = siteUrl(`/${appointment.professional.slug}/agendamento/${token}`);
  const ics = icsFile(
    appointmentToCalendarEvent(
      { ...appointment, professional: appointment.professional },
      manageUrl,
    ),
  );

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="agendamento.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
