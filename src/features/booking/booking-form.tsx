"use client";

import { useActionState, useMemo, useState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { dateFormatters } from "@/lib/format/date";
import { cn } from "@/lib/utils/cn";
import { createBooking } from "./actions";
import { SlotPicker, type SerializedDay } from "./slot-picker";

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
  const [slot, setSlot] = useState<string | null>(null);
  const e = state.fieldErrors ?? {};

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

      <SlotPicker
        timeZone={timeZone}
        days={days}
        slot={slot}
        onSlotChange={setSlot}
        error={e.starts_at?.[0]}
      />

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
