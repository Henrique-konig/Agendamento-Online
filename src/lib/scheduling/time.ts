import { TZDate } from "@date-fns/tz";

/** Data local (sem horário) no formato AAAA-MM-DD. */
export type LocalDate = string;

/** "09:30" ou "09:30:00" → minutos desde a meia-noite. */
export function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Converte data + minutos locais no fuso informado para um instante UTC. */
export function zonedToInstant(date: LocalDate, minutes: number, timeZone: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const h = Math.floor(minutes / 60);
  const mi = minutes % 60;
  return new Date(new TZDate(y, mo - 1, d, h, mi, 0, 0, timeZone).getTime());
}

/** Data local (AAAA-MM-DD) de um instante no fuso informado. */
export function instantToLocalDate(instant: Date, timeZone: string): LocalDate {
  const z = new TZDate(instant.getTime(), timeZone);
  return `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, "0")}-${String(z.getDate()).padStart(2, "0")}`;
}

/** Horário local (HH:MM) de um instante no fuso informado. */
export function instantToLocalTime(instant: Date, timeZone: string) {
  const z = new TZDate(instant.getTime(), timeZone);
  return minutesToTime(z.getHours() * 60 + z.getMinutes());
}

/** Dia da semana (0 = domingo) de uma data local. */
export function weekdayOf(date: LocalDate) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}

export function isLocalDate(value: string): value is LocalDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Valor de coluna TIME lido pelo Prisma (Date em UTC) → "HH:MM". */
export function timeColumnToString(value: Date) {
  return value.toISOString().slice(11, 16);
}
