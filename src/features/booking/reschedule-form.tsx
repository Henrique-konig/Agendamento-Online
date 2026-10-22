"use client";

import { useActionState, useMemo, useState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { dateFormatters } from "@/lib/format/date";
import { rescheduleBookingByToken } from "./actions";
import { SlotPicker, type SerializedDay } from "./slot-picker";

type Props = { token: string; timeZone: string; days: SerializedDay[] };

export function RescheduleForm({ token, timeZone, days }: Props) {
  const [state, action] = useActionState(rescheduleBookingByToken, initialActionState);
  const f = useMemo(() => dateFormatters(timeZone), [timeZone]);
  const [slot, setSlot] = useState<string | null>(null);

  if (!days.some((d) => d.slots.length)) {
    return (
      <p className="rounded-xl bg-white p-6 text-center text-sm text-ink-600 ring-1 ring-ink-200">
        Não há outros horários livres nos próximos dias. Fale direto com o profissional.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-8" noValidate>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="starts_at" value={slot ?? ""} />
      <FormMessage ok={state.ok} message={state.message} />
      <SlotPicker
        timeZone={timeZone}
        days={days}
        slot={slot}
        onSlotChange={setSlot}
        error={state.fieldErrors?.starts_at?.[0]}
        numbered={false}
      />
      <SubmitButton size="lg" className="w-full" disabled={!slot} pendingText="Remarcando…">
        {slot ? `Remarcar para ${f.time(slot)}` : "Escolha um horário"}
      </SubmitButton>
    </form>
  );
}
