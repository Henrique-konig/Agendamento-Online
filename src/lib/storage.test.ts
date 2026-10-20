import { describe, expect, it } from "vitest";
import { isOwnMediaUrl } from "./storage";

const id = "11111111-1111-4111-8111-111111111111";

describe("isOwnMediaUrl", () => {
  it("aceita arquivos da própria pasta no Blob", () => {
    expect(isOwnMediaUrl(`https://abc.public.blob.vercel-storage.com/${id}/foto-1.jpg`, id)).toBe(
      true,
    );
  });

  it("rejeita outra pasta, outro host e URLs inválidas", () => {
    expect(isOwnMediaUrl("https://abc.public.blob.vercel-storage.com/outro/foto.jpg", id)).toBe(
      false,
    );
    expect(isOwnMediaUrl(`https://evil.com/${id}/foto.jpg`, id)).toBe(false);
    expect(isOwnMediaUrl("não é url", id)).toBe(false);
    expect(isOwnMediaUrl(`http://abc.public.blob.vercel-storage.com/${id}/f.jpg`, id)).toBe(false);
  });
});
