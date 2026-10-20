import { describe, expect, it } from "vitest";
import { isValidSlug, slugify } from "./slug";

describe("slugify", () => {
  it("remove acentos e espaços", () => {
    expect(slugify("Barbearia do Zé")).toBe("barbearia-do-ze");
  });

  it("colapsa separadores e corta nas pontas", () => {
    expect(slugify("  --Dra. Ana  Nutrição!! ")).toBe("dra-ana-nutricao");
  });

  it("respeita o tamanho máximo sem terminar em hífen", () => {
    expect(slugify("a".repeat(39) + " b", 40)).toBe("a".repeat(39));
  });
});

describe("isValidSlug", () => {
  it("aceita slugs válidos", () => {
    expect(isValidSlug("joao-eletricista")).toBe(true);
  });

  it("rejeita reservados, curtos e com caracteres inválidos", () => {
    expect(isValidSlug("painel")).toBe(false);
    expect(isValidSlug("ab")).toBe(false);
    expect(isValidSlug("-abc")).toBe(false);
    expect(isValidSlug("ABC")).toBe(false);
  });
});
