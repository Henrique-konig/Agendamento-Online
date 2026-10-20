import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { cancelBookingByToken } from "@/features/booking/actions";
import { appointmentLocation, appointmentToCalendarEvent } from "@/features/booking/event";
import { canClientCancel, CLIENT_CANCEL_LIMIT_MINUTES } from "@/features/booking/policy";
import { getAppointmentByToken } from "@/features/booking/queries";
import { appointmentStatusLabel, appointmentStatusTone } from "@/features/booking/status";
import { PublicShell } from "@/features/public-page/public-shell";
import { googleCalendarLink } from "@/lib/calendar/links";
import { whatsappLink } from "@/lib/format/contact";
import { capitalize, dateFormatters } from "@/lib/format/date";
import { formatBRL } from "@/lib/format/money";
import { siteUrl } from "@/lib/env";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Seu agendamento", robots: { index: false } };

export default async function AppointmentPage(props: PageProps<"/[slug]/agendamento/[token]">) {
  const { slug, token } = await props.params;
  const appointment = await getAppointmentByToken(token);
  const professional = appointment?.professional;
  if (!appointment || !professional || professional.slug !== slug.toLowerCase()) notFound();

  const f = dateFormatters(professional.timezone);
  const manageUrl = siteUrl(`/${professional.slug}/agendamento/${token}`);
  const event = appointmentToCalendarEvent({ ...appointment, professional }, manageUrl);
  const location = appointmentLocation(professional);
  const active = appointment.status === "pending" || appointment.status === "confirmed";
  const cancellable = active && canClientCancel(appointment.starts_at);

  return (
    <PublicShell
      professional={professional}
      title={active ? "Agendamento recebido!" : "Seu agendamento"}
    >
      <div className="space-y-6">
        {appointment.status === "pending" ? (
          <Alert tone="warning">
            {professional.display_name} vai confirmar seu horário em breve.
          </Alert>
        ) : null}

        <div className="ring-ink-200 rounded-2xl bg-white p-6 ring-1">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
              appointmentStatusTone[appointment.status],
            )}
          >
            {appointmentStatusLabel[appointment.status]}
          </span>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Serviço" value={appointment.service_name} />
            <Row label="Data" value={capitalize(f.full(appointment.starts_at))} />
            <Row
              label="Horário"
              value={`${f.time(appointment.starts_at)} às ${f.time(appointment.ends_at)}`}
            />
            {appointment.price_cents != null ? (
              <Row label="Valor" value={formatBRL(appointment.price_cents)} />
            ) : null}
            {location ? <Row label="Local" value={location} /> : null}
            {appointment.client ? <Row label="Nome" value={appointment.client.name} /> : null}
          </dl>
        </div>

        {active ? (
          <div className="flex flex-wrap gap-3">
            <a
              href={googleCalendarLink(event)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("secondary")}
            >
              Adicionar ao Google Agenda
            </a>
            <a href={`/api/agendamento/${token}/ics`} className={buttonClasses("secondary")}>
              Baixar .ics (iPhone/Outlook)
            </a>
            {professional.whatsapp ? (
              <a
                href={whatsappLink(professional.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("ghost")}
              >
                Falar no WhatsApp
              </a>
            ) : null}
          </div>
        ) : null}

        <p className="text-ink-500 text-xs">
          Guarde este link para consultar ou cancelar seu agendamento.
        </p>

        {cancellable ? (
          <form action={cancelBookingByToken} className="border-ink-200 border-t pt-6">
            <input type="hidden" name="token" value={token} />
            <Button type="submit" variant="ghost" className="text-red-600">
              Cancelar agendamento
            </Button>
          </form>
        ) : active ? (
          <p className="border-ink-200 text-ink-500 border-t pt-6 text-sm">
            Cancelamentos online são aceitos até {CLIENT_CANCEL_LIMIT_MINUTES / 60} horas antes.
            Fale direto com o profissional.
          </p>
        ) : null}
      </div>
    </PublicShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="text-ink-500 w-20 shrink-0">{label}</dt>
      <dd className="text-ink-900 font-medium">{value}</dd>
    </div>
  );
}
