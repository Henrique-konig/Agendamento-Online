"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { createTimeOff } from "./actions";

export function TimeOffForm({ today }: { today: string }) {
  const [state, action] = useActionState(createTimeOff, initialActionState);
  const [allDay, setAllDay] = useState(true);
  const [start, setStart] = useState(today);
  const e = state.fieldErrors ?? {};

  return (
    <form action={action}>
      <Card>
        <CardHeader
          title="Novo bloqueio"
          description="Folgas, férias, consultas pessoais. Agendamentos existentes não são alterados."
        />
        <div className="space-y-5">
          <FormMessage ok={state.ok} message={state.message} />
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              name="all_day"
              checked={allDay}
              onChange={(ev) => setAllDay(ev.target.checked)}
              className="size-4 rounded border-ink-300"
            />
            Dia inteiro
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="De" name="start_date" errors={e.start_date}>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                min={today}
                value={start}
                onChange={(ev) => setStart(ev.target.value)}
              />
            </Field>
            <Field label="Até" name="end_date" errors={e.end_date}>
              <Input id="end_date" name="end_date" type="date" min={start} defaultValue={today} />
            </Field>
            {!allDay ? (
              <>
                <Field label="Das" name="start_time" errors={e.start_time}>
                  <Input id="start_time" name="start_time" type="time" defaultValue="12:00" />
                </Field>
                <Field label="Às" name="end_time" errors={e.end_time}>
                  <Input id="end_time" name="end_time" type="time" defaultValue="13:00" />
                </Field>
              </>
            ) : null}
          </div>
          <Field label="Motivo (só você vê)" name="reason">
            <Input id="reason" name="reason" maxLength={140} placeholder="Ex.: Férias" />
          </Field>
        </div>
        <div className="mt-6 flex justify-end">
          <SubmitButton>Bloquear</SubmitButton>
        </div>
      </Card>
    </form>
  );
}
