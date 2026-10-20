import { describe, expect, it } from "vitest";
import { bookingSchema } from "./schemas";

const valid = {
  slug: "barbearia-do-ze",
  service_id: "00000000-0000-4000-8000-000000000010",
  starts_at: "2026-11-02T12:00:00.000Z",
  name: "Maria",
  phone: "(51) 98888-7777",
  email: "",
  website: "",
};

describe("bookingSchema", () => {
  it("normaliza telefone e e-mail vazio", () => {
    const parsed = bookingSchema.parse(valid);
    expect(parsed.phone).toBe("5551988887777");
    expect(parsed.email).toBeNull();
  });

  it("rejeita quando o honeypot é preenchido", () => {
    expect(bookingSchema.safeParse({ ...valid, website: "spam" }).success).toBe(false);
  });

  it("exige horário em ISO com fuso", () => {
    expect(bookingSchema.safeParse({ ...valid, starts_at: "2026-11-02 09:00" }).success).toBe(
      false,
    );
  });
});
