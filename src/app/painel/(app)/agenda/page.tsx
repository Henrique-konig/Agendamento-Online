import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AppointmentList } from "@/features/appointments/appointment-list";
import { listAppointments } from "@/features/appointments/queries";
import { requireProfessional } from "@/lib/auth";
import { capitalize, dateFormatters, localDateAnchor } from "@/lib/format/date";
import { addDays, instantToLocalDate, isLocalDate, zonedToInstant } from "@/lib/scheduling/time";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Agenda" };

export default async function AgendaPage(props: PageProps<"/painel/agenda">) {
  const professional = await requireProfessional();
  const searchParams = await props.searchParams;
  const tz = professional.timezone;
  const today = instantToLocalDate(new Date(), tz);
  const day =
    typeof searchParams.dia === "string" && isLocalDate(searchParams.dia)
      ? searchParams.dia
      : today;

  const [appointments, pending] = await Promise.all([
    listAppointments(
      professional.id,
      zonedToInstant(day, 0, tz),
      zonedToInstant(addDays(day, 1), 0, tz),
    ),
    db.appointment.count({
      where: {
        professional_id: professional.id,
        status: "pending",
        starts_at: { gte: new Date() },
      },
    }),
  ]);

  const f = dateFormatters(tz);
  const nav = "rounded-lg px-3 py-1.5 text-sm ring-1 ring-ink-200 hover:bg-ink-50";

  return (
    <>
      <PageHeader
        title="Agenda"
        actions={<LinkButton href={`/painel/agenda/novo?dia=${day}`}>Novo agendamento</LinkButton>}
      />
      {pending ? (
        <div className="mb-6">
          <Alert tone="warning">Você tem {pending} agendamento(s) aguardando confirmação.</Alert>
        </div>
      ) : null}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-4">
          <h2 className="font-semibold text-ink-900">
            {day === today ? "Hoje · " : ""}
            {capitalize(f.long(localDateAnchor(day)))}
          </h2>
          <nav className="flex gap-2" aria-label="Navegar entre dias">
            <Link href={`/painel/agenda?dia=${addDays(day, -1)}`} className={nav}>
              ← Anterior
            </Link>
            {day !== today ? (
              <Link href="/painel/agenda" className={nav}>
                Hoje
              </Link>
            ) : null}
            <Link href={`/painel/agenda?dia=${addDays(day, 1)}`} className={nav}>
              Próximo →
            </Link>
          </nav>
        </div>
        <AppointmentList appointments={appointments} timeZone={tz} />
      </Card>
    </>
  );
}
