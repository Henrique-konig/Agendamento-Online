"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { saveAvailability } from "./actions";
import { WEEKDAYS, type Rule } from "./schemas";

// Exibe a semana a partir de segunda-feira.
const ORDER = [1, 2, 3, 4, 5, 6, 0];

type Row = Rule & { key: string };

let nextKey = 0;
const withKey = (r: Rule): Row => ({ ...r, key: String(nextKey++) });

export function WeeklyEditor({ initialRules }: { initialRules: Rule[] }) {
  const [state, action] = useActionState(saveAvailability, initialActionState);
  const [rows, setRows] = useState<Row[]>(() => initialRules.map(withKey));

  const update = (key: string, patch: Partial<Rule>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: string) => setRows((prev) => prev.filter((r) => r.key !== key));
  const add = (weekday: number) => {
    const last = rows.filter((r) => r.weekday === weekday).at(-1);
    const start = last ? last.end_time : "09:00";
    const end = last ? (last.end_time < "18:00" ? "18:00" : "23:00") : "18:00";
    setRows((prev) => [...prev, withKey({ weekday, start_time: start, end_time: end })]);
  };
  const copyToWeekdays = (weekday: number) => {
    const source = rows.filter((r) => r.weekday === weekday);
    setRows((prev) => [
      ...prev.filter((r) => r.weekday === weekday || r.weekday === 0 || r.weekday === 6),
      ...[1, 2, 3, 4, 5]
        .filter((d) => d !== weekday)
        .flatMap((d) => source.map((r) => withKey({ ...r, weekday: d }))),
    ]);
  };

  const payload = JSON.stringify(
    rows.map(({ weekday, start_time, end_time }) => ({ weekday, start_time, end_time })),
  );

  return (
    <form action={action}>
      <input type="hidden" name="rules" value={payload} />
      <Card>
        <CardHeader
          title="Horários de atendimento"
          description="Faixas em que clientes podem agendar. Use mais de uma faixa para pausas (almoço)."
        />
        <div className="space-y-4">
          <FormMessage ok={state.ok} message={state.message} />
          {ORDER.map((weekday) => {
            const dayRows = rows.filter((r) => r.weekday === weekday);
            return (
              <div
                key={weekday}
                className="border-ink-100 flex flex-col gap-3 border-b pb-4 last:border-0 sm:flex-row"
              >
                <div className="text-ink-800 w-36 shrink-0 pt-2 text-sm font-medium">
                  {WEEKDAYS[weekday]}
                </div>
                <div className="flex-1 space-y-2">
                  {dayRows.length ? (
                    dayRows.map((row) => (
                      <div key={row.key} className="flex items-center gap-2">
                        <TimeInput
                          label={`Início ${WEEKDAYS[weekday]}`}
                          value={row.start_time}
                          onChange={(v) => update(row.key, { start_time: v })}
                        />
                        <span className="text-ink-400">–</span>
                        <TimeInput
                          label={`Fim ${WEEKDAYS[weekday]}`}
                          value={row.end_time}
                          onChange={(v) => update(row.key, { end_time: v })}
                        />
                        <button
                          type="button"
                          onClick={() => remove(row.key)}
                          aria-label="Remover faixa"
                          className="text-ink-400 hover:bg-ink-100 rounded-md px-2 py-1 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-ink-400 pt-2 text-sm">Fechado</p>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => add(weekday)}
                      className="text-brand-700 text-sm font-medium hover:underline"
                    >
                      + Adicionar faixa
                    </button>
                    {dayRows.length && weekday >= 1 && weekday <= 5 ? (
                      <button
                        type="button"
                        onClick={() => copyToWeekdays(weekday)}
                        className="text-ink-500 text-sm hover:underline"
                      >
                        Copiar para seg–sex
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRows(initialRules.map(withKey))}>
            Desfazer
          </Button>
          <SubmitButton>Salvar horários</SubmitButton>
        </div>
      </Card>
    </form>
  );
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="time"
      step={300}
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="ring-ink-200 focus:ring-brand-600 h-9 rounded-lg border-0 px-2 text-sm ring-1 focus:ring-2"
    />
  );
}
