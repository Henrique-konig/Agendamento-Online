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
};

export function BookingForm({ slug, serviceId, timeZone, days }: Props) {
  const [state, action] = useActionState(createBooking, initialActionState);
  const f = useMemo(() => dateFormatters(timeZone), [timeZone]);
  const firstAvailable = days.find((d) => d.slots.length)?.date ?? null;
  const [date, setDate] = useState<string | null>(firstAvailable);
  const [slot, setSlot] = useState<string | null>(null);
  const e = state.fieldErrors ?? {};
  const selectedDay = days.find((d) => d.date === date);

  if (!firstAvailable) {
    return (
      <p className="text-ink-600 ring-ink-200 rounded-xl bg-white p-6 text-center text-sm ring-1">
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

      <fieldset>
        <legend className="text-ink-900 mb-3 text-sm font-semibold">1. Escolha o dia</legend>
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
                  "flex w-16 shrink-0 flex-col items-center rounded-xl py-2 text-sm ring-1 transition-colors",
                  active
                    ? "bg-brand-600 ring-brand-600 text-white"
                    : "text-ink-800 ring-ink-200 hover:ring-brand-400 bg-white",
                  !available && "hover:ring-ink-200 cursor-not-allowed opacity-40",
                )}
              >
                <span className="text-xs capitalize">{f.weekdayShort(anchor)}</span>
                <span className="text-lg font-semibold">{day.date.slice(8)}</span>
                <span className="text-[10px] opacity-75">{f.short(anchor).slice(3)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {selectedDay ? (
        <fieldset>
          <legend className="text-ink-900 mb-3 text-sm font-semibold">
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
                  "rounded-lg py-2 text-sm font-medium ring-1 transition-colors",
                  slot === s
                    ? "bg-brand-600 ring-brand-600 text-white"
                    : "text-ink-800 ring-ink-200 hover:ring-brand-400 bg-white",
                )}
              >
                {f.time(s)}
              </button>
            ))}
          </div>
          {e.starts_at ? <p className="mt-2 text-xs text-red-600">{e.starts_at[0]}</p> : null}
        </fieldset>
      ) : null}

      <fieldset className={cn("space-y-5", !slot && "pointer-events-none opacity-50")}>
        <legend className="text-ink-900 mb-3 text-sm font-semibold">3. Seus dados</legend>
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
        <Field label="E-mail (opcional)" name="email" errors={e.email}>
          <Input id="email" name="email" type="email" autoComplete="email" />
        </Field>
        <Field label="Observações (opcional)" name="notes" errors={e.notes}>
          <Textarea id="notes" name="notes" rows={3} maxLength={1000} />
        </Field>
        <SubmitButton size="lg" className="w-full" disabled={!slot} pendingText="Reservando…">
          {slot ? `Confirmar ${f.time(slot)}` : "Escolha um horário"}
        </SubmitButton>
      </fieldset>
    </form>
  );
}
