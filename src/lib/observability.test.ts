import { describe, expect, it } from "vitest";
import { buildErrorLog } from "./observability";

const now = new Date("2026-11-10T15:00:00Z");

describe("buildErrorLog", () => {
  it("registra rota, método e digest, sem URL", () => {
    const error = Object.assign(new Error("falhou"), { digest: "123456" });
    const log = buildErrorLog(
      error,
      { method: "POST" },
      { routePath: "/[slug]/agendamento/[token]", routeType: "render" },
      now,
    );
    expect(log).toMatchObject({
      level: "error",
      msg: "request_error",
      time: "2026-11-10T15:00:00.000Z",
      digest: "123456",
      name: "Error",
      message: "falhou",
      method: "POST",
      route: "/[slug]/agendamento/[token]",
    });
    expect(Object.keys(log)).not.toContain("path");
    expect(Object.keys(log)).not.toContain("url");
  });

  it("não vaza tokens: só o padrão da rota entra no log", () => {
    const token = "e66d70fc-1c7b-40d8-8618-7da3c7bdb2fb";
    const log = buildErrorLog(
      new Error("x"),
      { method: "GET" },
      { routePath: "/[slug]/agendamento/[token]" },
      now,
    );
    expect(JSON.stringify(log)).not.toContain(token);
  });

  it("limita e normaliza mensagens longas e com quebras de linha", () => {
    const log = buildErrorLog(
      new Error("linha 1\n\n   linha 2 " + "x".repeat(1000)),
      { method: "GET" },
      {},
      now,
    );
    expect(log.message.length).toBeLessThanOrEqual(300);
    expect(log.message).not.toMatch(/\n/);
    expect(log.message.startsWith("linha 1 linha 2")).toBe(true);
  });

  it("aceita valores que não são Error (string, null)", () => {
    expect(buildErrorLog("texto solto", { method: "GET" }, {}, now)).toMatchObject({
      name: "string",
      message: "texto solto",
    });
    expect(buildErrorLog(null, { method: "GET" }, {}, now).message).toBe("null");
  });
});
