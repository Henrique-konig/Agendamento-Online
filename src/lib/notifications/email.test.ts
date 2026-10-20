import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const sendMail = vi.fn();
vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail })) },
}));

const MESSAGE = {
  to: "a@b.com",
  subject: "Olá",
  html: "<p>h</p>",
  text: "h",
  idempotencyKey: "k1",
};

function clearProviders() {
  for (const key of ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_PORT", "RESEND_API_KEY"]) {
    vi.stubEnv(key, "");
  }
}

describe("sendEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
    sendMail.mockReset();
  });

  it("não envia sem provedor configurado", async () => {
    clearProviders();
    const { sendEmail, isEmailConfigured } = await import("./email");
    expect(isEmailConfigured()).toBe(false);
    expect(await sendEmail(MESSAGE)).toEqual({
      status: "skipped",
      reason: "nenhum provedor de e-mail configurado",
    });
  });

  it("usa SMTP quando configurado", async () => {
    clearProviders();
    vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
    vi.stubEnv("SMTP_USER", "eu@gmail.com");
    vi.stubEnv("SMTP_PASSWORD", "senha-de-app");
    vi.stubEnv("EMAIL_FROM", "Agenda <eu@gmail.com>");
    sendMail.mockResolvedValue({ messageId: "<id@gmail>" });
    const { sendEmail, isEmailConfigured } = await import("./email");

    expect(isEmailConfigured()).toBe(true);
    expect(await sendEmail(MESSAGE)).toEqual({ status: "sent", providerId: "<id@gmail>" });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: "Agenda <eu@gmail.com>", to: "a@b.com", subject: "Olá" }),
    );
  });

  it("reporta falha do SMTP", async () => {
    clearProviders();
    vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
    vi.stubEnv("SMTP_USER", "eu@gmail.com");
    vi.stubEnv("SMTP_PASSWORD", "errada");
    sendMail.mockRejectedValue(new Error("Invalid login"));
    const { sendEmail } = await import("./email");
    expect(await sendEmail(MESSAGE)).toEqual({ status: "failed", error: "Invalid login" });
  });

  it("cai para o Resend quando não há SMTP", async () => {
    clearProviders();
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: "email_123" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { sendEmail } = await import("./email");

    expect(await sendEmail(MESSAGE)).toEqual({ status: "sent", providerId: "email_123" });
    expect(fetchMock.mock.calls[0][1].headers["Idempotency-Key"]).toBe("k1");
  });
});
