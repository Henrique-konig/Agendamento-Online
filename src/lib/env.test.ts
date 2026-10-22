import { describe, expect, it } from "vitest";
import { readIntegrationsEnv } from "./env";

describe("readIntegrationsEnv", () => {
  it("sem variáveis: tudo ausente, com os padrões", () => {
    const { env, problems } = readIntegrationsEnv({});
    expect(problems).toEqual([]);
    expect(env.SMTP_PORT).toBe(465);
    expect(env.CRON_SECRET).toBeUndefined();
  });

  it("string vazia conta como ausente", () => {
    const { env, problems } = readIntegrationsEnv({ SMTP_HOST: "", CRON_SECRET: "" });
    expect(problems).toEqual([]);
    expect(env.SMTP_HOST).toBeUndefined();
  });

  it("CRON_SECRET curto não derruba o resto", () => {
    const { env, problems } = readIntegrationsEnv({
      CRON_SECRET: "curto",
      SMTP_HOST: "smtp.gmail.com",
      SMTP_USER: "eu@gmail.com",
      SMTP_PASSWORD: "abcd",
    });
    expect(env.CRON_SECRET).toBeUndefined();
    expect(env.SMTP_HOST).toBe("smtp.gmail.com");
    expect(problems.map((p) => p.name)).toEqual(["CRON_SECRET"]);
  });

  it("porta inválida volta ao padrão e é reportada", () => {
    const { env, problems } = readIntegrationsEnv({ SMTP_PORT: "abc" });
    expect(env.SMTP_PORT).toBe(465);
    expect(problems.map((p) => p.name)).toEqual(["SMTP_PORT"]);
  });

  it("o problema não vaza o valor da variável", () => {
    const { problems } = readIntegrationsEnv({ CRON_SECRET: "segredo123" });
    expect(JSON.stringify(problems)).not.toContain("segredo123");
  });
});
