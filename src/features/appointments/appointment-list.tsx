import Link from "next/link";
import { confirmPixPayment } from "@/features/payments/actions";
import { formatBRL } from "@/lib/format/money";
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
    return <p className="py-8 text-center text-sm text-ink-500">Nenhum agendamento.</p>;
  }

  return (
    <ul className="divide-y divide-ink-100">
      {appointments.map((a) => {
        const past = new Date(a.ends_at) < now;
        const active = a.status === "pending" || a.status === "confirmed";
        return (
          <li key={a.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
            <div className="w-24 shrink-0">
              <p className="font-semibold text-ink-900 tabular-nums">{f.time(a.starts_at)}</p>
              <p className="text-xs text-ink-500 tabular-nums">até {f.time(a.ends_at)}</p>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-ink-900">{a.service_name}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs ring-1",
                    appointmentStatusTone[a.status],
                  )}
                >
                  {appointmentStatusLabel[a.status]}
                </span>
                {a.payment_status === "pending" || a.payment_status === "paid" ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs ring-1",
                      a.payment_status === "paid"
                        ? "bg-brand-50 text-brand-800 ring-brand-200"
                        : "bg-amber-50 text-amber-800 ring-amber-200",
                    )}
                  >
                    {a.payment_status === "paid" ? "Pix pago" : "Aguardando Pix"} ·{" "}
                    {formatBRL(a.payment_amount_cents ?? 0)}
                  </span>
                ) : null}
              </div>
              {a.client ? (
                <p className="mt-0.5 text-sm text-ink-600">
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
              {a.notes ? <p className="mt-1 text-sm text-ink-500 italic">“{a.notes}”</p> : null}
            </div>
            {active ? (
              <div className="flex flex-wrap gap-1">
                {a.payment_status === "pending" && a.payment_provider === "manual" ? (
                  <form action={confirmPixPayment}>
                    <input type="hidden" name="id" value={a.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
                    >
                      Pix recebido
                    </button>
                  </form>
                ) : a.status === "pending" && a.payment_status !== "pending" ? (
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
