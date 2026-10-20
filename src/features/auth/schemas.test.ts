import { describe, expect, it } from "vitest";
import { safeNextPath } from "./schemas";

describe("safeNextPath", () => {
  it("aceita caminhos internos", () => {
    expect(safeNextPath("/painel/servicos")).toBe("/painel/servicos");
  });

  it("rejeita URLs externas e protocol-relative", () => {
    expect(safeNextPath("https://evil.com")).toBe("/painel");
    expect(safeNextPath("//evil.com")).toBe("/painel");
    expect(safeNextPath(undefined)).toBe("/painel");
  });
});
