"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import type { Tables } from "@/types/database";
import { saveScheduleSettings } from "./actions";

const intervals = [10, 15, 20, 30, 45, 60, 90, 120];
const notices = [
  [0, "Sem antecedência"],
  [30, "30 minutos"],
  [60, "1 hora"],
  [120, "2 horas"],
  [240, "4 horas"],
  [720, "12 horas"],
  [1440, "1 dia"],
  [2880, "2 dias"],
] as const;
const horizons = [7, 14, 30, 60, 90];
const buffers = [0, 5, 10, 15, 30, 45, 60];

export function ScheduleSettingsForm({
  professional: p,
}: {
  professional: Tables<"professionals">;
}) {
  const [state, action] = useActionState(saveScheduleSettings, initialActionState);

  return (
    <form action={action}>
      <Card>
        <CardHeader title="Regras de agendamento" />
        <div className="space-y-5">
          <FormMessage ok={state.ok} message={state.message} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Intervalo entre horários"
              name="slot_interval_minutes"
              hint="De quanto em quanto tempo os horários são oferecidos."
            >
              <Select
                id="slot_interval_minutes"
                name="slot_interval_minutes"
                defaultValue={p.slot_interval_minutes}
              >
                {withCurrent(intervals, p.slot_interval_minutes).map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Antecedência mínima" name="min_notice_minutes">
              <Select
                id="min_notice_minutes"
                name="min_notice_minutes"
                defaultValue={p.min_notice_minutes}
              >
                {notices.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Agenda aberta para os próximos" name="max_days_ahead">
              <Select id="max_days_ahead" name="max_days_ahead" defaultValue={p.max_days_ahead}>
                {withCurrent(horizons, p.max_days_ahead).map((d) => (
                  <option key={d} value={d}>
                    {d} dias
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Folga entre atendimentos"
              name="buffer_minutes"
              hint="Tempo para deslocamento, limpeza ou preparo."
            >
              <Select id="buffer_minutes" name="buffer_minutes" defaultValue={p.buffer_minutes}>
                {withCurrent(buffers, p.buffer_minutes).map((m) => (
                  <option key={m} value={m}>
                    {m ? `${m} min` : "Sem folga"}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="booking_enabled"
              defaultChecked={p.booking_enabled}
              className="border-ink-300 mt-0.5 size-4 rounded"
            />
            <span>
              <span className="text-ink-900 font-medium">Aceitar agendamentos online</span>
              <span className="text-ink-500 block">Desative em férias longas.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="auto_confirm"
              defaultChecked={p.auto_confirm}
              className="border-ink-300 mt-0.5 size-4 rounded"
            />
            <span>
              <span className="text-ink-900 font-medium">Confirmar automaticamente</span>
              <span className="text-ink-500 block">
                Se desmarcado, cada reserva fica pendente até você confirmar.
              </span>
            </span>
          </label>
        </div>
        <div className="mt-6 flex justify-end">
          <SubmitButton>Salvar regras</SubmitButton>
        </div>
      </Card>
    </form>
  );
}

function withCurrent(values: number[], current: number) {
  return values.includes(current) ? values : [...values, current].sort((a, b) => a - b);
}
