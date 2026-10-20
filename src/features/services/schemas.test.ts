import { describe, expect, it } from "vitest";
import { serviceSchema, toServiceRow } from "./schemas";

describe("serviceSchema", () => {
  it("converte preço e checkboxes", () => {
    const parsed = serviceSchema.parse({
      name: "Corte",
      duration_minutes: "30",
      price: "45,00",
      active: "on",
    });
    expect(toServiceRow(parsed)).toEqual({
      name: "Corte",
      description: null,
      duration_minutes: 30,
      price_cents: 4500,
      price_is_starting: false,
      requires_quote: false,
      requires_prepayment: false,
      active: true,
    });
  });

  it("aceita preço vazio como sob consulta", () => {
    const parsed = serviceSchema.parse({ name: "Instalação", duration_minutes: "120", price: "" });
    expect(parsed.price).toBeNull();
  });

  it("rejeita preço inválido", () => {
    const result = serviceSchema.safeParse({ name: "X1", duration_minutes: "30", price: "abc" });
    expect(result.success).toBe(false);
  });
});
