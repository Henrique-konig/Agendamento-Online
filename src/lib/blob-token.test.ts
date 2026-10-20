import { describe, expect, it } from "vitest";
import { describeBlobToken, isValidBlobToken, normalizeBlobToken } from "./blob-token";

const TOKEN = "vercel_blob_rw_H2OB7991KtP3Oj8K_abcDEF123";

describe("normalizeBlobToken", () => {
  it("aceita o token puro", () => expect(normalizeBlobToken(TOKEN)).toBe(TOKEN));
  it("remove aspas e espaços", () => expect(normalizeBlobToken(`  "${TOKEN}" \n`)).toBe(TOKEN));
  it("remove o prefixo NOME=", () =>
    expect(normalizeBlobToken(`BLOB_READ_WRITE_TOKEN="${TOKEN}"`)).toBe(TOKEN));
  it("vazio vira undefined", () => expect(normalizeBlobToken("  ")).toBeUndefined());
});

describe("isValidBlobToken", () => {
  it("aceita o formato certo", () => expect(isValidBlobToken(TOKEN)).toBe(true));
  it("recusa o store id e valores soltos", () => {
    expect(isValidBlobToken("store_H2OB7991KtP3Oj8K")).toBe(false);
    expect(isValidBlobToken("*************")).toBe(false);
  });
});

describe("describeBlobToken", () => {
  it("não revela o segredo", () => expect(describeBlobToken(TOKEN)).not.toContain("abcDEF123"));
});
