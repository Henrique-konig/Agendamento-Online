import { describe, expect, it } from "vitest";
import { capitalize, dateFormatters, localDateAnchor } from "./date";

describe("dateFormatters", () => {
  const f = dateFormatters("America/Sao_Paulo");

  it("formata hora no fuso do profissional", () => {
    expect(f.time("2026-11-02T12:00:00Z")).toBe("09:00");
  });

  it("formata datas longas", () => {
    expect(capitalize(f.long(localDateAnchor("2026-11-02")))).toBe("Segunda-feira, 2 de novembro");
  });
});
