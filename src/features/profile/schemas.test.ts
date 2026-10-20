import { describe, expect, it } from "vitest";
import { profileSchema } from "./schemas";

const base = { display_name: "Barbearia do Zé", profession: "Barbeiro", slug: "barbearia-do-ze" };

describe("profileSchema", () => {
  it("normaliza campos opcionais", () => {
    const result = profileSchema.parse({
      ...base,
      bio: "  ",
      whatsapp: "(51) 99999-8888",
      instagram: "@barbeariadoze",
      state: "rs",
      postal_code: "90000-000",
      published: "on",
    });
    expect(result).toMatchObject({
      bio: null,
      whatsapp: "5551999998888",
      instagram: "barbeariadoze",
      state: "RS",
      postal_code: "90000000",
      published: true,
      show_address: false,
    });
  });

  it("aponta erros de contato", () => {
    const result = profileSchema.safeParse({ ...base, whatsapp: "123", contact_email: "x" });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["whatsapp", "contact_email"]));
  });
});
