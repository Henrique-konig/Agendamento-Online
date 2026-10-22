"use client";

import { useMemo, useState } from "react";
import { capitalize, dateFormatters, localDateAnchor } from "@/lib/format/date";
import { cn } from "@/lib/utils/cn";

export type SerializedDay = { date: string; slots: string[] };

type Props = {
  timeZone: string;
  days: SerializedDay[];
  slot: string | null;
  onSlotChange: (slot: string | null) => void;
  error?: string;
  /** Prefixo dos títulos numerados ("1. Escolha o dia"). */
  numbered?: boolean;
};

/** Escolha do dia e do horário livre; o horário escolhido é controlado pelo pai. */
export function SlotPicker({ timeZone, days, slot, onSlotChange, error, numbered = true }: Props) {
  const f = useMemo(() => dateFormatters(timeZone), [timeZone]);
  const [date, setDate] = useState<string | null>(days.find((d) => d.slots.length)?.date ?? null);
  const selectedDay = days.find((d) => d.date === date);

  return (
    <>
      {/* min-w-0: por padrão um fieldset cresce até caber o conteúdo e estoura a página. */}
      <fieldset className="min-w-0">
        <legend className="mb-3 text-sm font-semibold text-ink-900">
          {numbered ? "1. " : ""}Escolha o dia
        </legend>
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
                  onSlotChange(null);
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
                <span className="text-[10px] opacity-75">{f.short(anchor).slice(3)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {selectedDay ? (
        <fieldset className="min-w-0">
          <legend className="mb-3 text-sm font-semibold text-ink-900">
            {numbered ? "2. " : ""}Escolha o horário ·{" "}
            {capitalize(f.long(localDateAnchor(selectedDay.date)))}
          </legend>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {selectedDay.slots.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={slot === s}
                onClick={() => onSlotChange(s)}
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
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        </fieldset>
      ) : null}
    </>
  );
}
