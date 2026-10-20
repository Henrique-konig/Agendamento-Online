import Link from "next/link";
import { updateAppointmentStatus } from "./actions";
import type { AppointmentListItem } from "./queries";
import { appointmentStatusLabel, appointmentStatusTone } from "@/features/booking/status";
import { formatPhoneBR, whatsappLink } from "@/lib/format/contact";
import { dateFormatters } from "@/lib/format/date";
import { cn } from "@/lib/utils/cn";

type Props = { appointments: AppointmentListItem[]; timeZone: string; now?: Date };

export function AppointmentList({ appointments, timeZone, now = new Date() }: Props) {
  const f = dateFormatters(timeZone);

  if (!appointments.length) {
    return <p className="text-ink-500 py-8 text-center text-sm">Nenhum agendamento.</p>;
  }

  return (
    <ul className="divide-ink-100 divide-y">
      {appointments.map((a) => {
        const past = new Date(a.ends_at) < now;
        const active = a.status === "pending" || a.status === "confirmed";
        return (
          <li key={a.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
            <div className="w-24 shrink-0">
              <p className="text-ink-900 font-semibold tabular-nums">{f.time(a.starts_at)}</p>
              <p className="text-ink-500 text-xs tabular-nums">até {f.time(a.ends_at)}</p>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-ink-900 font-medium">{a.service_name}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs ring-1",
                    appointmentStatusTone[a.status],
                  )}
                >
                  {appointmentStatusLabel[a.status]}
                </span>
              </div>
              {a.client ? (
                <p className="text-ink-600 mt-0.5 text-sm">
                  <Link href={`/painel/clientes/${a.client.id}`} className="hover:underline">
                    {a.client.name}
                  </Link>{" "}
                  ·{" "}
                  <a
                    href={whatsappLink(a.client.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-700 hover:underline"
                  >
                    {formatPhoneBR(a.client.phone)}
                  </a>
                </p>
              ) : null}
              {a.notes ? <p className="text-ink-500 mt-1 text-sm italic">“{a.notes}”</p> : null}
            </div>
            {active ? (
              <div className="flex flex-wrap gap-1">
                {a.status === "pending" ? (
                  <StatusButton id={a.id} status="confirmed" label="Confirmar" />
                ) : null}
                {past ? (
                  <>
                    <StatusButton id={a.id} status="completed" label="Concluído" />
                    <StatusButton id={a.id} status="no_show" label="Faltou" />
                  </>
                ) : (
                  <StatusButton id={a.id} status="cancelled" label="Cancelar" danger />
                )}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function StatusButton({
  id,
  status,
  label,
  danger,
}: {
  id: string;
  status: string;
  label: string;
  danger?: boolean;
}) {
  return (
    <form action={updateAppointmentStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={cn(
          "rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
          danger
            ? "text-red-700 ring-red-200 hover:bg-red-50"
            : "text-ink-700 ring-ink-200 hover:bg-ink-50",
        )}
      >
        {label}
      </button>
    </form>
  );
}
