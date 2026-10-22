"use client";

import { useActionState, useMemo, useState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { capitalize, dateFormatters, localDateAnchor } from "@/lib/format/date";
import { cn } from "@/lib/utils/cn";
import { createBooking } from "./actions";

export type SerializedDay = { date: string; slots: string[] };

type Props = {
  slug: string;
  serviceId: string;
  timeZone: string;
  days: SerializedDay[];
  /** Sinal via Pix exigido para confirmar o horário. */
  prepayment?: { amountLabel: string; holdMinutes: number; requireEmail: boolean };
};

export function BookingForm({ slug, serviceId, timeZone, days, prepayment }: Props) {
  const [state, action] = useActionState(createBooking, initialActionState);
  const f = useMemo(() => dateFormatters(timeZone), [timeZone]);
  const firstAvailable = days.find((d) => d.slots.length)?.date ?? null;
  const [date, setDate] = useState<string | null>(firstAvailable);
  const [slot, setSlot] = useState<string | null>(null);
  const e = state.fieldErrors ?? {};
  const selectedDay = days.find((d) => d.date === date);

  if (!firstAvailable) {
    return (
      <p className="rounded-xl bg-white p-6 text-center text-sm text-ink-600 ring-1 ring-ink-200">
        Não há horários livres nos próximos dias. Entre em contato diretamente.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-8" noValidate>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="service_id" value={serviceId} />
      <input type="hidden" name="starts_at" value={slot ?? ""} />
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Não preencha
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <FormMessage ok={state.ok} message={state.message} />

      {/* min-w-0: por padrão um fieldset cresce até caber o conteúdo e estoura a página. */}
      <fieldset className="min-w-0">
        <legend className="mb-3 text-sm font-semibold text-ink-900">1. Escolha o dia</legend>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
          {days.map((day) => {
            const anchor = localDateAnchor(day.date);
            const available = day.slots.length > 0;
            const active = day.date === date;
            return (
              <button
                key={day.date}
                type="button"
                disabled={!available}
                aria-pressed={active}
                onClick={() => {
                  setDate(day.date);
                  setSlot(null);
                }}
                className={cn(
                  "flex w-16 shrink-0 flex-col items-center rounded-xl py-2 text-sm ring-1 transition-all duration-200 active:scale-95",
                  active
                    ? "bg-brand-600 text-white ring-brand-600"
                    : "bg-white text-ink-800 ring-ink-200 hover:ring-brand-400",
                  !available && "cursor-not-allowed opacity-40 hover:ring-ink-200",
                )}
              >
                <span className="text-xs capitalize">{f.weekdayShort(anchor)}</span>
                <span className="text-lg font-semibold">{day.date.slice(8)}</span>
                <span className="text-[10px] opacity-90">{f.short(anchor).slice(3)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {selectedDay ? (
        <fieldset className="min-w-0">
          <legend className="mb-3 text-sm font-semibold text-ink-900">
            2. Escolha o horário · {capitalize(f.long(localDateAnchor(selectedDay.date)))}
          </legend>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {selectedDay.slots.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={slot === s}
                onClick={() => setSlot(s)}
                className={cn(
                  "rounded-lg py-2 font-mono text-sm ring-1 transition-all duration-200 active:scale-95",
                  slot === s
                    ? "bg-amber-400 font-semibold text-ink-900 shadow-soft ring-amber-400"
                    : "bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100",
                )}
              >
                {f.time(s)}
              </button>
            ))}
          </div>
          {e.starts_at ? <p className="mt-2 text-xs text-red-600">{e.starts_at[0]}</p> : null}
        </fieldset>
      ) : null}

      <fieldset disabled={!slot} className={cn("min-w-0 space-y-5", !slot && "opacity-50")}>
        <legend className="mb-3 text-sm font-semibold text-ink-900">3. Seus dados</legend>
        <Field label="Nome" name="name" errors={e.name}>
          <Input id="name" name="name" autoComplete="name" required />
        </Field>
        <Field
          label="WhatsApp"
          name="phone"
          hint="Usado para confirmação e lembrete."
          errors={e.phone}
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(51) 99999-8888"
            required
          />
        </Field>
        <Field
          label={prepayment?.requireEmail ? "E-mail" : "E-mail (opcional)"}
          name="email"
          errors={e.email}
        >
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required={prepayment?.requireEmail}
          />
        </Field>
        <Field label="Observações (opcional)" name="notes" errors={e.notes}>
          <Textarea id="notes" name="notes" rows={3} maxLength={1000} />
        </Field>
        {prepayment ? (
          <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-900 ring-1 ring-brand-200">
            Para garantir o horário, é cobrado um sinal de <strong>{prepayment.amountLabel}</strong>{" "}
            via Pix. O horário fica reservado por {prepayment.holdMinutes} minutos aguardando o
            pagamento.
          </p>
        ) : null}
        <SubmitButton size="lg" className="w-full" disabled={!slot} pendingText="Reservando…">
          {!slot
            ? "Escolha um horário"
            : prepayment
              ? `Reservar ${f.time(slot)} e pagar Pix`
              : `Confirmar ${f.time(slot)}`}
        </SubmitButton>
      </fieldset>
    </form>
  );
}
