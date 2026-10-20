import { describe, expect, it } from "vitest";
import { formatPhoneBR, normalizeBrazilianPhone, whatsappLink } from "./contact";

describe("telefone", () => {
  it("normaliza celular com e sem DDI", () => {
    expect(normalizeBrazilianPhone("(51) 99999-8888")).toBe("5551999998888");
    expect(normalizeBrazilianPhone("+55 51 99999-8888")).toBe("5551999998888");
    expect(normalizeBrazilianPhone("9999")).toBeNull();
  });

  it("formata para exibição", () => {
    expect(formatPhoneBR("5551999998888")).toBe("(51) 99999-8888");
    expect(formatPhoneBR("5133334444")).toBe("(51) 3333-4444");
  });

  it("monta link do WhatsApp", () => {
    expect(whatsappLink("5551999998888", "Olá!")).toBe(
      "https://wa.me/5551999998888?text=Ol%C3%A1%21",
    );
  });
});
