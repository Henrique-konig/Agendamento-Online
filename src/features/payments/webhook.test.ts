import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/features/booking/notify", () => ({ emitBookingEvent: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {} }));

const { extractPaymentId } = await import("./webhook");

describe("extractPaymentId", () => {
  it("lê o formato JSON atual", () => {
    expect(extractPaymentId({ type: "payment", data: { id: 123456 } }, new URLSearchParams())).toBe(
      "123456",
    );
  });

  it("lê o formato por query string", () => {
    expect(extractPaymentId(null, new URLSearchParams("type=payment&data.id=987"))).toBe("987");
  });

  it("ignora outros tópicos e ids inválidos", () => {
    expect(
      extractPaymentId({ type: "merchant_order", data: { id: 1 } }, new URLSearchParams()),
    ).toBeNull();
    expect(
      extractPaymentId({ type: "payment", data: { id: "1;drop" } }, new URLSearchParams()),
    ).toBeNull();
  });
});
