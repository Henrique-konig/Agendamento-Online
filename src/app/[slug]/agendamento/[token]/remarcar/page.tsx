import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { getAvailableDays } from "@/features/booking/availability";
import { ACTIVE_STATUSES, canClientReschedule } from "@/features/booking/policy";
import { getAppointmentByToken } from "@/features/booking/queries";
import { RescheduleForm } from "@/features/booking/reschedule-form";
import { PublicShell } from "@/features/public-page/public-shell";
import { capitalize, dateFormatters } from "@/lib/format/date";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Remarcar agendamento", robots: { index: false } };

export default async function ReschedulePage(
  props: PageProps<"/[slug]/agendamento/[token]/remarcar">,
) {
  const { slug, token } = await props.params;
  const appointment = await getAppointmentByToken(token);
  const professional = appointment?.professional;
  if (!appointment || !professional || professional.slug !== slug.toLowerCase()) notFound();

  const back = `/${professional.slug}/agendamento/${token}`;
  const allowed =
    (ACTIVE_STATUSES as readonly string[]).includes(appointment.status) &&
    professional.booking_enabled &&
    appointment.payment_status !== "pending" &&
    canClientReschedule(appointment.starts_at);
  if (!allowed) redirect(back);

  const durationMinutes = Math.round(
    (appointment.ends_at.getTime() - appointment.starts_at.getTime()) / 60_000,
  );
  // O cálculo de horários precisa das regras completas do profissional.
  const fullProfessional = await db.professional.findUnique({
    where: { id: appointment.professional_id },
  });
  if (!fullProfessional) notFound();
  const days = await getAvailableDays(
    fullProfessional,
    { duration_minutes: durationMinutes },
    appointment.id,
  );
  const f = dateFormatters(professional.timezone);

  return (
    <PublicShell professional={professional} title="Escolha o novo horário">
      <div className="mb-8 rounded-xl bg-white p-4 ring-1 ring-ink-200">
        <p className="font-medium text-ink-900">{appointment.service_name}</p>
        <p className="text-sm text-ink-500">
          Agora: {capitalize(f.full(appointment.starts_at))}, {f.time(appointment.starts_at)}
        </p>
      </div>
      <div className="mb-6">
        <Alert tone="info">O horário atual só é liberado depois que você confirmar o novo.</Alert>
      </div>
      <RescheduleForm
        token={token}
        timeZone={professional.timezone}
        days={days.map((d) => ({ date: d.date, slots: d.slots.map((s) => s.toISOString()) }))}
      />
      <p className="mt-8 text-center text-sm">
        <Link href={back} className="text-brand-700 hover:underline">
          Voltar sem remarcar
        </Link>
      </p>
    </PublicShell>
  );
}
