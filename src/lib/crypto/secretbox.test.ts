import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./secretbox";

const key = randomBytes(32).toString("base64");

describe("secretbox", () => {
  it("criptografa e descriptografa", () => {
    const token = "1//0g-refresh-token";
    const sealed = encrypt(token, key);
    expect(sealed).not.toContain(token);
    expect(decrypt(sealed, key)).toBe(token);
  });

  it("usa IV aleatório", () => {
    expect(encrypt("x", key)).not.toBe(encrypt("x", key));
  });

  it("detecta adulteração e chave errada", () => {
    const sealed = encrypt("segredo", key);
    const parts = sealed.split(".");
    parts[3] = Buffer.from("outro").toString("base64url");
    expect(() => decrypt(parts.join("."), key)).toThrow();
    expect(() => decrypt(sealed, randomBytes(32).toString("base64"))).toThrow();
  });

  it("rejeita chave de tamanho errado", () => {
    expect(() => encrypt("x", Buffer.from("curta").toString("base64"))).toThrow(/32 bytes/);
  });
});
