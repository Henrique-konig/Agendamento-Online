import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("sendEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("não envia sem chave configurada", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { sendEmail } = await import("./email");
    const result = await sendEmail({ to: "a@b.com", subject: "s", html: "h", text: "t" });
    expect(result).toEqual({ status: "skipped", reason: "RESEND_API_KEY ausente" });
  });

  it("envia com chave de idempotência e devolve o id", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: "email_123" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { sendEmail } = await import("./email");

    const result = await sendEmail({
      to: "a@b.com",
      subject: "Olá",
      html: "<p>h</p>",
      text: "h",
      idempotencyKey: "k1",
    });

    expect(result).toEqual({ status: "sent", providerId: "email_123" });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["Idempotency-Key"]).toBe("k1");
    expect(JSON.parse(init.body)).toMatchObject({ to: ["a@b.com"], subject: "Olá" });
  });

  it("reporta falha da API", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ message: "domínio inválido" }), { status: 422 }),
        ),
    );
    const { sendEmail } = await import("./email");
    const result = await sendEmail({ to: "a@b.com", subject: "s", html: "h", text: "t" });
    expect(result).toEqual({ status: "failed", error: "domínio inválido" });
  });
});
