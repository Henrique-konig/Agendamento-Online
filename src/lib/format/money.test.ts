import { describe, expect, it } from "vitest";
import {
  centsToInput,
  formatBRL,
  formatDuration,
  formatServicePrice,
  parseBRLToCents,
} from "./money";

describe("parseBRLToCents", () => {
  it.each([
    ["80", 8000],
    ["80,5", 8050],
    ["80,05", 8005],
    ["1.250,00", 125000],
    ["R$ 45,90", 4590],
    ["0", 0],
  ])("%s → %d", (input, expected) => {
    expect(parseBRLToCents(input)).toBe(expected);
  });

  it.each(["", "abc", "1,234", "12.34", "-5"])("rejeita %j", (input) => {
    expect(parseBRLToCents(input)).toBeNull();
  });
});

describe("formatação", () => {
  it("formata reais", () => {
    expect(formatBRL(4590).replace(/\s/g, " ")).toBe("R$ 45,90");
  });

  it("converte centavos para input", () => {
    expect(centsToInput(8050)).toBe("80,50");
    expect(centsToInput(null)).toBe("");
  });

  it("descreve preço do serviço", () => {
    const base = { price_is_starting: false, requires_quote: false };
    expect(formatServicePrice({ ...base, price_cents: null })).toBe("Sob consulta");
    expect(formatServicePrice({ ...base, price_cents: null, requires_quote: true })).toBe(
      "Sob orçamento",
    );
    expect(formatServicePrice({ ...base, price_cents: 5000, price_is_starting: true })).toMatch(
      /^A partir de R\$/,
    );
  });

  it("formata duração", () => {
    expect(formatDuration(30)).toBe("30 min");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(90)).toBe("1h30");
  });
});
