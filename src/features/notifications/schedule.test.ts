import { describe, expect, it } from "vitest";
import { isDueForReminder } from "./schedule";

const tz = "America/Sao_Paulo";

describe("isDueForReminder", () => {
  // 20/10/2026 22:30 em São Paulo = 21/10 01:30 UTC
  const now = new Date("2026-10-21T01:30:00Z");

  it("seleciona compromissos de amanhã no fuso do profissional", () => {
    // 21/10 08:00 local
    expect(
      isDueForReminder({ id: "1", starts_at: "2026-10-21T11:00:00Z", timezone: tz }, now),
    ).toBe(true);
    // 21/10 23:30 local (22/10 02:30 UTC)
    expect(
      isDueForReminder({ id: "2", starts_at: "2026-10-22T02:30:00Z", timezone: tz }, now),
    ).toBe(true);
  });

  it("ignora hoje e depois de amanhã", () => {
    // 20/10 23:00 local — ainda hoje, embora já seja 21/10 em UTC
    expect(
      isDueForReminder({ id: "3", starts_at: "2026-10-21T02:00:00Z", timezone: tz }, now),
    ).toBe(false);
    expect(
      isDueForReminder({ id: "4", starts_at: "2026-10-22T12:00:00Z", timezone: tz }, now),
    ).toBe(false);
  });
});
