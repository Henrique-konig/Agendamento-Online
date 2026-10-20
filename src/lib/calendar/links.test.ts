import { describe, expect, it } from "vitest";
import { googleCalendarLink, icsFile } from "./links";

const event = {
  uid: "abc@agenda",
  title: "Corte, com Zé",
  start: new Date("2026-11-02T12:00:00Z"),
  end: new Date("2026-11-02T12:30:00Z"),
  location: "Rua A, 10; Centro",
};

describe("links de calendário", () => {
  it("gera link do Google Agenda com datas UTC", () => {
    const url = new URL(googleCalendarLink(event));
    expect(url.searchParams.get("dates")).toBe("20261102T120000Z/20261102T123000Z");
    expect(url.searchParams.get("text")).toBe("Corte, com Zé");
  });

  it("gera .ics com CRLF e texto escapado", () => {
    const ics = icsFile(event, new Date("2026-10-20T00:00:00Z"));
    expect(ics).toContain("DTSTART:20261102T120000Z\r\n");
    expect(ics).toContain("SUMMARY:Corte\\, com Zé");
    expect(ics).toContain("LOCATION:Rua A\\, 10\\; Centro");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});
