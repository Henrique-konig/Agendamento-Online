import { describe, expect, it } from "vitest";
import { depositAmountCents } from "./amount";

describe("depositAmountCents", () => {
  it("cobra o valor integral com 100%", () => {
    expect(depositAmountCents(4590, 100)).toBe(4590);
  });

  it("arredonda sinal parcial para cima em reais inteiros", () => {
    expect(depositAmountCents(4590, 30)).toBe(1400); // 13,77 → 14,00
    expect(depositAmountCents(10000, 50)).toBe(5000);
  });

  it("tem mínimo de R$ 1,00 e ignora serviços sem preço", () => {
    expect(depositAmountCents(150, 10)).toBe(100);
    expect(depositAmountCents(0, 50)).toBe(0);
  });
});
