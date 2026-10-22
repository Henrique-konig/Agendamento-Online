import { describe, expect, it } from "vitest";
import { canReview } from "./policy";
import { shortName, summarizeRatings } from "./summary";

describe("summarizeRatings", () => {
  it("sem notas: média nula", () => {
    expect(summarizeRatings([])).toEqual({
      count: 0,
      average: null,
      distribution: [0, 0, 0, 0, 0],
    });
  });

  it("média com uma casa e distribuição por nota", () => {
    const s = summarizeRatings([5, 5, 4, 5, 3]);
    expect(s.count).toBe(5);
    expect(s.average).toBe(4.4);
    expect(s.distribution).toEqual([0, 0, 1, 1, 3]);
  });

  it("ignora notas inválidas", () => {
    const s = summarizeRatings([5, 0, 6, 3.5, 5]);
    expect(s.count).toBe(2);
    expect(s.average).toBe(5);
  });
});

describe("shortName", () => {
  it("abrevia o último sobrenome", () => {
    expect(shortName("Maria Souza Lima")).toBe("Maria L.");
    expect(shortName("  joão   silva ")).toBe("joão S.");
  });
  it("nome único e vazio", () => {
    expect(shortName("Ana")).toBe("Ana");
    expect(shortName("   ")).toBe("Cliente");
  });
});

describe("canReview", () => {
  const now = new Date("2026-11-10T15:00:00Z");
  const past = new Date("2026-11-10T14:00:00Z");
  const future = new Date("2026-11-10T16:00:00Z");

  it("só depois que o atendimento terminou", () => {
    expect(canReview({ status: "completed", ends_at: past }, now)).toBe(true);
    expect(canReview({ status: "confirmed", ends_at: past }, now)).toBe(true);
    expect(canReview({ status: "confirmed", ends_at: future }, now)).toBe(false);
  });

  it("nunca para cancelado, pendente ou falta", () => {
    for (const status of ["cancelled", "pending", "no_show"]) {
      expect(canReview({ status, ends_at: past }, now)).toBe(false);
    }
  });
});
