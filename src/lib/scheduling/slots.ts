import {
  addDays,
  instantToLocalDate,
  timeToMinutes,
  weekdayOf,
  zonedToInstant,
  type LocalDate,
} from "./time";

export type AvailabilityRule = { weekday: number; start_time: string; end_time: string };
export type Interval = { start: Date; end: Date };

export type SlotOptions = {
  rules: AvailabilityRule[];
  busy: Interval[];
  timeZone: string;
  durationMinutes: number;
  intervalMinutes: number;
  bufferMinutes: number;
  minNoticeMinutes: number;
  maxDaysAhead: number;
  now: Date;
  /** Restringe o cálculo a uma data local específica. */
  onlyDate?: LocalDate;
};

export type DaySlots = { date: LocalDate; slots: Date[] };

const MINUTE = 60_000;

function overlaps(a: Interval, b: Interval) {
  return a.start < b.end && b.start < a.end;
}

/** Datas locais da janela de agendamento: hoje até hoje + maxDaysAhead. */
export function bookingWindow(now: Date, timeZone: string, maxDaysAhead: number): LocalDate[] {
  const today = instantToLocalDate(now, timeZone);
  return Array.from({ length: maxDaysAhead + 1 }, (_, i) => addDays(today, i));
}

/**
 * Calcula os horários livres para um serviço.
 *
 * Um horário é oferecido quando: cabe inteiro dentro de uma faixa de
 * atendimento do dia; respeita a antecedência mínima; e não colide com
 * nenhum intervalo ocupado (agendamentos, bloqueios, Google Agenda),
 * considerando a folga (buffer) antes e depois de cada compromisso.
 */
export function computeAvailableSlots(options: SlotOptions): DaySlots[] {
  const {
    rules,
    busy,
    timeZone,
    durationMinutes,
    intervalMinutes,
    bufferMinutes,
    minNoticeMinutes,
    maxDaysAhead,
    now,
    onlyDate,
  } = options;

  const earliest = new Date(now.getTime() + minNoticeMinutes * MINUTE);
  const padded = busy.map((b) => ({
    start: new Date(b.start.getTime() - bufferMinutes * MINUTE),
    end: new Date(b.end.getTime() + bufferMinutes * MINUTE),
  }));

  const window = bookingWindow(now, timeZone, maxDaysAhead);
  const dates = onlyDate ? window.filter((d) => d === onlyDate) : window;

  return dates.map((date) => {
    const weekday = weekdayOf(date);
    const dayRules = rules
      .filter((r) => r.weekday === weekday)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

    const slots: Date[] = [];
    const seen = new Set<number>();

    for (const rule of dayRules) {
      const ruleStart = timeToMinutes(rule.start_time);
      const ruleEnd = timeToMinutes(rule.end_time);

      for (let m = ruleStart; m + durationMinutes <= ruleEnd; m += intervalMinutes) {
        const start = zonedToInstant(date, m, timeZone);
        const end = new Date(start.getTime() + durationMinutes * MINUTE);
        if (start < earliest || seen.has(start.getTime())) continue;
        if (padded.some((b) => overlaps({ start, end }, b))) continue;
        seen.add(start.getTime());
        slots.push(start);
      }
    }

    return { date, slots };
  });
}

/** Verifica se um início específico continua disponível (usado ao confirmar a reserva). */
export function isSlotAvailable(start: Date, options: Omit<SlotOptions, "onlyDate">) {
  const date = instantToLocalDate(start, options.timeZone);
  const [day] = computeAvailableSlots({ ...options, onlyDate: date });
  return Boolean(day?.slots.some((s) => s.getTime() === start.getTime()));
}
