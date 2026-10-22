"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

const DAYS = [
  { label: "Seg", day: 3, slots: ["09:00", "09:30", "10:30", "14:00", "15:30"] },
  { label: "Ter", day: 4, slots: ["08:30", "11:00", "13:30", "16:00"] },
  { label: "Qua", day: 5, slots: ["09:30", "10:00", "10:30", "14:30", "17:00", "17:30"] },
  { label: "Qui", day: 6, slots: ["09:00", "13:00", "15:00"] },
  { label: "Sex", day: 7, slots: ["08:00", "08:30", "10:00", "11:30", "14:00"] },
];

const TAKEN = new Set(["Seg-10:30", "Qua-10:00", "Sex-10:00"]);

/** Agenda de demonstração: mostra o que o cliente do profissional vê ao marcar. */
export function DemoBooking() {
  const [dayIndex, setDayIndex] = useState(0);
  const [slot, setSlot] = useState<string | null>("09:30");
  const day = DAYS[dayIndex];
  const booked = slot !== null;

  return (
    <div className="relative w-full max-w-sm">
      <div
        aria-hidden
        className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-amber-200/60 via-transparent to-brand-200/60 blur-2xl"
      />
      <div className="overflow-hidden rounded-3xl bg-white shadow-lift ring-1 ring-ink-200/70">
        <div className="flex items-center gap-3 border-b border-ink-100 px-5 py-4">
          <span className="grid size-10 place-items-center rounded-full bg-brand-700 font-display text-sm font-semibold text-white">
            DZ
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">Barbearia do Zé</p>
            <p className="truncate text-xs text-ink-500">Corte masculino · 30 min · R$ 45</p>
          </div>
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-pulse-dot rounded-full bg-brand-500" />
            <span className="relative inline-flex size-2 rounded-full bg-brand-600" />
          </span>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div>
            <p className="mb-2.5 font-mono text-[11px] tracking-wider text-ink-400 uppercase">
              Outubro · escolha o dia
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {DAYS.map((d, i) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => {
                    setDayIndex(i);
                    setSlot(null);
                  }}
                  aria-pressed={i === dayIndex}
                  className={cn(
                    "rounded-xl py-2 text-center transition-all duration-200 active:scale-95",
                    i === dayIndex
                      ? "bg-brand-700 text-white shadow-soft"
                      : "bg-ink-50 text-ink-700 hover:bg-ink-100",
                  )}
                >
                  <span className="block text-[11px] opacity-90">{d.label}</span>
                  <span className="block font-display text-lg leading-tight font-semibold">
                    {d.day}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2.5 font-mono text-[11px] tracking-wider text-ink-400 uppercase">
              Horários livres
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {day.slots.map((s) => {
                const taken = TAKEN.has(`${day.label}-${s}`);
                const selected = slot === s;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={taken}
                    onClick={() => setSlot(s)}
                    aria-pressed={selected}
                    className={cn(
                      "rounded-lg py-2 font-mono text-sm transition-all duration-200 active:scale-95",
                      selected
                        ? "bg-amber-400 font-semibold text-ink-900 shadow-soft"
                        : taken
                          ? "bg-ink-50 text-ink-300 line-through"
                          : "bg-amber-50 text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={cn(
              "flex items-center justify-center rounded-xl py-3 text-sm font-medium transition-colors duration-300",
              booked ? "bg-brand-700 text-white" : "bg-ink-100 text-ink-400",
            )}
          >
            {booked ? `Confirmar ${day.label} ${day.day}, ${slot}` : "Escolha um horário"}
          </div>
        </div>
      </div>
    </div>
  );
}
