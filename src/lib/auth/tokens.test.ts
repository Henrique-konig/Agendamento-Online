import { describe, expect, it } from "vitest";
import { generateToken, hashToken } from "./tokens";

describe("tokens", () => {
  it("gera tokens únicos e longos", () => {
    const a = generateToken();
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(generateToken()).not.toBe(a);
  });

  it("hash é determinístico e não revela o token", () => {
    const token = generateToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toContain(token);
    expect(hashToken(token)).toHaveLength(64);
  });
});
