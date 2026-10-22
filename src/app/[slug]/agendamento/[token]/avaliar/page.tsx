import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { canReview } from "@/features/reviews/policy";
import { getAppointmentByToken } from "@/features/booking/queries";
import { ReviewForm } from "@/features/reviews/review-form";
import { PublicShell } from "@/features/public-page/public-shell";
import { capitalize, dateFormatters } from "@/lib/format/date";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Avaliar atendimento", robots: { index: false } };

export default async function ReviewPage(props: PageProps<"/[slug]/agendamento/[token]/avaliar">) {
  const { slug, token } = await props.params;
  const appointment = await getAppointmentByToken(token);
  const professional = appointment?.professional;
  if (!appointment || !professional || professional.slug !== slug.toLowerCase()) notFound();

  const back = `/${professional.slug}/agendamento/${token}`;
  const existing = await db.review.findUnique({
    where: { appointment_id: appointment.id },
    select: { id: true },
  });
  if (existing || !canReview(appointment)) redirect(back);

  const f = dateFormatters(professional.timezone);
  return (
    <PublicShell professional={professional} title="Como foi o atendimento?">
      <div className="mb-8 rounded-xl bg-white p-4 ring-1 ring-ink-200">
        <p className="font-medium text-ink-900">{appointment.service_name}</p>
        <p className="text-sm text-ink-500">
          {capitalize(f.full(appointment.starts_at))}, {f.time(appointment.starts_at)}
        </p>
      </div>
      <ReviewForm token={token} />
    </PublicShell>
  );
}
