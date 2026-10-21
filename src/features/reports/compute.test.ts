import { describe, expect, it } from "vitest";
import {
  computeReport,
  localWeekdayAndHour,
  percentChange,
  type ReportAppointment,
} from "./compute";

const TZ = "America/Sao_Paulo"; // UTC-3
const NOW = new Date("2026-11-10T15:00:00Z");

function appt(
  startsAtUtc: string,
  over: Partial<ReportAppointment> = {},
  minutes = 30,
): ReportAppointment {
  const starts = new Date(startsAtUtc);
  return {
    starts_at: starts,
    ends_at: new Date(starts.getTime() + minutes * 60_000),
    status: "confirmed",
    price_cents: 4500,
    service_name: "Corte",
    source: "online",
    ...over,
  };
}

describe("localWeekdayAndHour", () => {
  it("usa o fuso do profissional, não o UTC", () => {
    // 02/11/2026 01:30 UTC = domingo 01/11 22:30 em São Paulo
    expect(localWeekdayAndHour(new Date("2026-11-02T01:30:00Z"), TZ)).toEqual({
      weekday: 0,
      hour: 22,
    });
    expect(localWeekdayAndHour(new Date("2026-11-02T12:00:00Z"), TZ)).toEqual({
      weekday: 1,
      hour: 9,
    });
  });

  it("meia-noite local é hora 0, não 24", () => {
    expect(localWeekdayAndHour(new Date("2026-11-02T03:00:00Z"), TZ).hour).toBe(0);
  });
});

describe("computeReport", () => {
  it("sem dados: zeros e taxas nulas", () => {
    const r = computeReport([], TZ, NOW);
    expect(r.total).toBe(0);
    expect(r.noShowRate).toBeNull();
    expect(r.cancelRate).toBeNull();
    expect(r.onlineShare).toBeNull();
    expect(r.byWeekday).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it("confirmado só conta como realizado depois que o horário passou", () => {
    const r = computeReport(
      [
        appt("2026-11-09T12:00:00Z"), // passou
        appt("2026-11-12T12:00:00Z"), // futuro
        appt("2026-11-08T12:00:00Z", { status: "completed" }),
      ],
      TZ,
      NOW,
    );
    expect(r.realized).toBe(2);
    expect(r.revenueCents).toBe(9000);
  });

  it("taxa de faltas = faltas / (realizados + faltas); cancelados ficam de fora", () => {
    const r = computeReport(
      [
        appt("2026-11-02T12:00:00Z", { status: "completed" }),
        appt("2026-11-03T12:00:00Z", { status: "completed" }),
        appt("2026-11-04T12:00:00Z", { status: "completed" }),
        appt("2026-11-05T12:00:00Z", { status: "no_show" }),
        appt("2026-11-06T12:00:00Z", { status: "cancelled" }),
      ],
      TZ,
      NOW,
    );
    expect(r.noShow).toBe(1);
    expect(r.noShowRate).toBeCloseTo(0.25);
    expect(r.cancelRate).toBeCloseTo(0.2);
    expect(r.realized).toBe(3);
  });

  it("cancelados não entram em dia da semana, hora nem serviços", () => {
    const r = computeReport(
      [appt("2026-11-02T12:00:00Z"), appt("2026-11-02T13:00:00Z", { status: "cancelled" })],
      TZ,
      NOW,
    );
    expect(r.byWeekday[1]).toBe(1);
    expect(r.byHour).toEqual([{ hour: 9, count: 1 }]);
    expect(r.services).toEqual([{ name: "Corte", count: 1, revenueCents: 4500 }]);
  });

  it("serviços ordenados por quantidade e depois por receita; sem preço conta 0", () => {
    const r = computeReport(
      [
        appt("2026-11-02T12:00:00Z", { service_name: "Barba", price_cents: 3000 }),
        appt("2026-11-03T12:00:00Z", { service_name: "Corte" }),
        appt("2026-11-04T12:00:00Z", { service_name: "Corte" }),
        appt("2026-11-05T12:00:00Z", { service_name: "Orçamento", price_cents: null }),
      ],
      TZ,
      NOW,
    );
    expect(r.services.map((s) => s.name)).toEqual(["Corte", "Barba", "Orçamento"]);
    expect(r.services[0].revenueCents).toBe(9000);
    expect(r.services[2].revenueCents).toBe(0);
  });

  it("parcela de agendamentos online", () => {
    const r = computeReport(
      [
        appt("2026-11-02T12:00:00Z"),
        appt("2026-11-03T12:00:00Z", { source: "painel" }),
        appt("2026-11-04T12:00:00Z", { source: "painel" }),
        appt("2026-11-05T12:00:00Z", { source: "online", status: "cancelled" }),
      ],
      TZ,
      NOW,
    );
    expect(r.onlineShare).toBeCloseTo(1 / 3);
  });
});

describe("percentChange", () => {
  it("calcula a variação e evita divisão por zero", () => {
    expect(percentChange(15, 10)).toBeCloseTo(0.5);
    expect(percentChange(5, 10)).toBeCloseTo(-0.5);
    expect(percentChange(5, 0)).toBeNull();
  });
});
