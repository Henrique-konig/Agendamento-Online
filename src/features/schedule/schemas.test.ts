import { describe, expect, it } from "vitest";
import { rulesSchema, timeOffSchema } from "./schemas";

describe("rulesSchema", () => {
  it("aceita faixas separadas no mesmo dia", () => {
    const rules = [
      { weekday: 1, start_time: "09:00", end_time: "12:00" },
      { weekday: 1, start_time: "13:00", end_time: "18:00" },
    ];
    expect(rulesSchema.safeParse(rules).success).toBe(true);
  });

  it("rejeita faixas sobrepostas e invertidas", () => {
    expect(
      rulesSchema.safeParse([
        { weekday: 2, start_time: "09:00", end_time: "12:00" },
        { weekday: 2, start_time: "11:00", end_time: "14:00" },
      ]).success,
    ).toBe(false);
    expect(
      rulesSchema.safeParse([{ weekday: 2, start_time: "12:00", end_time: "09:00" }]).success,
    ).toBe(false);
  });
});

describe("timeOffSchema", () => {
  it("exige horários quando não é dia inteiro", () => {
    const r = timeOffSchema.safeParse({ start_date: "2026-11-02", end_date: "2026-11-02" });
    expect(r.success).toBe(false);
  });

  it("aceita bloqueio de dia inteiro", () => {
    const r = timeOffSchema.safeParse({
      start_date: "2026-12-24",
      end_date: "2026-12-26",
      all_day: "on",
    });
    expect(r.success).toBe(true);
  });
});
