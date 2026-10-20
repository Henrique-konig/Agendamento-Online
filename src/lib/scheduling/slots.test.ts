import { describe, expect, it } from "vitest";
import { computeAvailableSlots, isSlotAvailable, type SlotOptions } from "./slots";
import { instantToLocalTime, isLocalDate, weekdayOf, zonedToInstant } from "./time";

const TZ = "America/Sao_Paulo"; // UTC-3, sem horário de verão

// Segunda-feira, 2 de novembro de 2026, 08:00 em São Paulo (11:00 UTC).
const now = new Date("2026-11-02T11:00:00Z");

const base: SlotOptions = {
  rules: [
    { weekday: 1, start_time: "09:00", end_time: "12:00" },
    { weekday: 1, start_time: "13:00", end_time: "15:00" },
  ],
  busy: [],
  timeZone: TZ,
  durationMinutes: 60,
  intervalMinutes: 30,
  bufferMinutes: 0,
  minNoticeMinutes: 0,
  maxDaysAhead: 0,
  now,
};

function times(options: SlotOptions) {
  return computeAvailableSlots(options)[0].slots.map((s) => instantToLocalTime(s, TZ));
}

describe("utilitários de tempo", () => {
  it("converte hora local para UTC", () => {
    expect(zonedToInstant("2026-11-02", 9 * 60, TZ).toISOString()).toBe("2026-11-02T12:00:00.000Z");
  });

  it("lida com fusos que têm horário de verão", () => {
    // 1º/11/2026: fim do horário de verão nos EUA (UTC-4 → UTC-5)
    expect(zonedToInstant("2026-10-31", 540, "America/New_York").toISOString()).toBe(
      "2026-10-31T13:00:00.000Z",
    );
    expect(zonedToInstant("2026-11-02", 540, "America/New_York").toISOString()).toBe(
      "2026-11-02T14:00:00.000Z",
    );
  });

  it("calcula dia da semana e valida datas", () => {
    expect(weekdayOf("2026-11-02")).toBe(1);
    expect(isLocalDate("2026-02-30")).toBe(false);
    expect(isLocalDate("2026-02-28")).toBe(true);
  });
});

describe("computeAvailableSlots", () => {
  it("gera horários que cabem inteiros em cada faixa", () => {
    expect(times(base)).toEqual([
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "13:00",
      "13:30",
      "14:00",
    ]);
  });

  it("remove horários que colidem com compromissos", () => {
    const busy = [
      { start: zonedToInstant("2026-11-02", 600, TZ), end: zonedToInstant("2026-11-02", 660, TZ) },
    ];
    expect(times({ ...base, busy })).toEqual(["09:00", "11:00", "13:00", "13:30", "14:00"]);
  });

  it("aplica a folga antes e depois dos compromissos", () => {
    // 10:00–11:00 com 15 min de folga ocupa 09:45–11:15
    const busy = [
      { start: zonedToInstant("2026-11-02", 600, TZ), end: zonedToInstant("2026-11-02", 660, TZ) },
    ];
    expect(times({ ...base, busy, bufferMinutes: 15 })).toEqual(["13:00", "13:30", "14:00"]);
  });

  it("respeita a antecedência mínima", () => {
    // agora 08:00 + 3h = 11:00
    expect(times({ ...base, minNoticeMinutes: 180 })).toEqual(["11:00", "13:00", "13:30", "14:00"]);
  });

  it("devolve a janela de dias pedida, vazia em dias sem expediente", () => {
    const days = computeAvailableSlots({ ...base, maxDaysAhead: 2 });
    expect(days.map((d) => d.date)).toEqual(["2026-11-02", "2026-11-03", "2026-11-04"]);
    expect(days[1].slots).toEqual([]);
  });

  it("confirma disponibilidade de um horário específico", () => {
    const start = zonedToInstant("2026-11-02", 9 * 60, TZ);
    expect(isSlotAvailable(start, base)).toBe(true);
    expect(isSlotAvailable(new Date(start.getTime() + 10 * 60_000), base)).toBe(false);
  });
});
