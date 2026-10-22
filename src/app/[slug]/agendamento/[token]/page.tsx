import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { cancelBookingByToken } from "@/features/booking/actions";
import { appointmentLocation, appointmentToCalendarEvent } from "@/features/booking/event";
import { canClientCancel, CLIENT_CANCEL_LIMIT_MINUTES } from "@/features/booking/policy";
import { getAppointmentByToken } from "@/features/booking/queries";
import { appointmentStatusLabel, appointmentStatusTone } from "@/features/booking/status";
import { canReview } from "@/features/reviews/policy";
import { PixPayment } from "@/features/payments/pix-payment";
import { PublicShell } from "@/features/public-page/public-shell";
import { googleCalendarLink } from "@/lib/calendar/links";
import { whatsappLink } from "@/lib/format/contact";
import { capitalize, dateFormatters } from "@/lib/format/date";
import { formatBRL } from "@/lib/format/money";
import { siteUrl } from "@/lib/env";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Seu agendamento", robots: { index: false } };

export default async function AppointmentPage(props: PageProps<"/[slug]/agendamento/[token]">) {
  const [{ slug, token }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const appointment = await getAppointmentByToken(token);
  const professional = appointment?.professional;
  if (!appointment || !professional || professional.slug !== slug.toLowerCase()) notFound();

  const f = dateFormatters(professional.timezone);
  const manageUrl = siteUrl(`/${professional.slug}/agendamento/${token}`);
  const event = appointmentToCalendarEvent({ ...appointment, professional }, manageUrl);
  const location = appointmentLocation(professional);
  const active = appointment.status === "pending" || appointment.status === "confirmed";
  const awaitingPix =
    active &&
    appointment.payment_status === "pending" &&
    appointment.pix_copy_paste &&
    appointment.payment_amount_cents &&
    appointment.payment_expires_at;
  const cancellable = active && canClientCancel(appointment.starts_at);
  const reviewable = canReview(appointment);
  const review = reviewable
    ? await db.review.findUnique({
        where: { appointment_id: appointment.id },
        select: { rating: true },
      })
    : null;
  const reschedulable = cancellable && professional.booking_enabled && !awaitingPix;

  return (
    <PublicShell
      professional={professional}
      title={
        awaitingPix
          ? "Finalize com o Pix"
          : active
            ? searchParams.remarcado === "1"
              ? "Horário alterado!"
              : "Agendamento recebido!"
            : "Seu agendamento"
      }
    >
      <div className="space-y-6">
        {searchParams.remarcado === "1" ? (
          <Alert tone="success">Enviamos a confirmação do novo horário por e-mail.</Alert>
        ) : null}
        {awaitingPix ? (
          <PixPayment
            copyPaste={appointment.pix_copy_paste!}
            amountCents={appointment.payment_amount_cents!}
            expiresAt={appointment.payment_expires_at!.toISOString()}
            timeZone={professional.timezone}
            automatic={appointment.payment_provider === "mercadopago"}
          />
        ) : appointment.status === "pending" ? (
          <Alert tone="warning">
            {professional.display_name} vai confirmar seu horário em breve.
          </Alert>
        ) : null}
        {appointment.payment_status === "paid" ? (
          <Alert tone="success">
            Pagamento de {formatBRL(appointment.payment_amount_cents ?? 0)} confirmado.
          </Alert>
        ) : null}
        {appointment.payment_status === "expired" ? (
          <Alert tone="error">O prazo do Pix venceu e o horário foi liberado.</Alert>
        ) : null}

        <div className="rounded-2xl bg-white p-6 ring-1 ring-ink-200">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
              appointmentStatusTone[appointment.status],
            )}
          >
            {awaitingPix ? "Aguardando pagamento" : appointmentStatusLabel[appointment.status]}
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

        {reviewable ? (
          review ? (
            <Alert tone="success">Obrigado pela sua avaliação ({review.rating} de 5)!</Alert>
          ) : (
            <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-ink-200">
              <p className="font-display text-lg font-semibold text-ink-900">
                Como foi o atendimento?
              </p>
              <p className="mt-1 text-sm text-ink-500">Leva menos de um minuto.</p>
              <Link
                href={`/${professional.slug}/agendamento/${token}/avaliar`}
                className={cn(buttonClasses("primary"), "mt-4")}
              >
                Avaliar atendimento
              </Link>
            </div>
          )
        ) : null}

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

        <p className="text-xs text-ink-500">
          Guarde este link para consultar, remarcar ou cancelar seu agendamento.
        </p>

        {cancellable ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-ink-200 pt-6">
            {reschedulable ? (
              <Link
                href={`/${professional.slug}/agendamento/${token}/remarcar`}
                className={buttonClasses("secondary")}
              >
                Remarcar horário
              </Link>
            ) : null}
            <form action={cancelBookingByToken}>
              <input type="hidden" name="token" value={token} />
              <Button type="submit" variant="ghost" className="text-red-600">
                Cancelar agendamento
              </Button>
            </form>
          </div>
        ) : active ? (
          <p className="border-t border-ink-200 pt-6 text-sm text-ink-500">
            Remarcações e cancelamentos online são aceitos até {CLIENT_CANCEL_LIMIT_MINUTES / 60}{" "}
            horas antes. Fale direto com o profissional.
          </p>
        ) : null}
      </div>
    </PublicShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-20 shrink-0 text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-900">{value}</dd>
    </div>
  );
}
