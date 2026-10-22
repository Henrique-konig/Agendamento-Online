import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buttonPayload,
  extractReplies,
  parseButtonPayload,
  verifyMetaSignature,
  verifyTokenMatches,
} from "./whatsapp-webhook";

const TOKEN = "e66d70fc-1c7b-40d8-8618-7da3c7bdb2fb";
const sign = (body: string, secret: string) =>
  `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

describe("verifyMetaSignature", () => {
  const body = JSON.stringify({ hello: "mundo" });

  it("aceita a assinatura correta", () => {
    expect(verifyMetaSignature(body, sign(body, "segredo"), "segredo")).toBe(true);
  });

  it("recusa corpo alterado, segredo errado, formato inválido ou ausente", () => {
    expect(verifyMetaSignature(body + " ", sign(body, "segredo"), "segredo")).toBe(false);
    expect(verifyMetaSignature(body, sign(body, "outro"), "segredo")).toBe(false);
    expect(verifyMetaSignature(body, "sha256=zzzz", "segredo")).toBe(false);
    expect(verifyMetaSignature(body, "md5=abc", "segredo")).toBe(false);
    expect(verifyMetaSignature(body, null, "segredo")).toBe(false);
    expect(verifyMetaSignature(body, "sha256=", "segredo")).toBe(false);
  });
});

describe("verifyTokenMatches", () => {
  it("compara o token de verificação", () => {
    expect(verifyTokenMatches("abc123", "abc123")).toBe(true);
    expect(verifyTokenMatches("abc124", "abc123")).toBe(false);
    expect(verifyTokenMatches("abc", "abc123")).toBe(false);
    expect(verifyTokenMatches(null, "abc123")).toBe(false);
  });
});

describe("payload dos botões", () => {
  it("ida e volta", () => {
    expect(parseButtonPayload(buttonPayload("confirm", TOKEN))).toEqual({
      action: "confirm",
      token: TOKEN,
    });
    expect(parseButtonPayload(buttonPayload("cancel", TOKEN))?.action).toBe("cancel");
  });

  it("recusa formatos estranhos", () => {
    for (const bad of [
      "delete:" + TOKEN,
      "confirm:",
      "confirm:não-é-uuid",
      "confirm:" + TOKEN + "x",
      " confirm:" + TOKEN,
      "CONFIRM:" + TOKEN,
      42,
      null,
      undefined,
    ]) {
      expect(parseButtonPayload(bad)).toBeNull();
    }
  });
});

describe("extractReplies", () => {
  const wrap = (messages: unknown[]) => ({
    object: "whatsapp_business_account",
    entry: [{ id: "1", changes: [{ field: "messages", value: { messages } }] }],
  });

  it("lê resposta rápida de template (type=button)", () => {
    const body = wrap([
      {
        from: "5551988887777",
        type: "button",
        button: { text: "Confirmo", payload: `confirm:${TOKEN}` },
      },
    ]);
    expect(extractReplies(body)).toEqual([
      { from: "5551988887777", action: "confirm", token: TOKEN },
    ]);
  });

  it("lê resposta de mensagem interativa", () => {
    const body = wrap([
      {
        from: "5551988887777",
        type: "interactive",
        interactive: {
          type: "button_reply",
          button_reply: { id: `cancel:${TOKEN}`, title: "Cancelar" },
        },
      },
    ]);
    expect(extractReplies(body)).toEqual([
      { from: "5551988887777", action: "cancel", token: TOKEN },
    ]);
  });

  it("ignora texto livre, status de entrega e payload de outra origem", () => {
    expect(extractReplies(wrap([{ from: "5551", type: "text", text: { body: "oi" } }]))).toEqual(
      [],
    );
    expect(
      extractReplies({ entry: [{ changes: [{ value: { statuses: [{ status: "read" }] } }] }] }),
    ).toEqual([]);
    expect(
      extractReplies(
        wrap([{ from: "5551", type: "button", button: { payload: "qualquer-coisa" } }]),
      ),
    ).toEqual([]);
  });

  it("não quebra com corpo malformado", () => {
    for (const body of [
      null,
      undefined,
      {},
      [],
      "x",
      { entry: "x" },
      { entry: [{ changes: null }] },
    ]) {
      expect(extractReplies(body)).toEqual([]);
    }
  });

  it("várias respostas no mesmo envio", () => {
    const body = wrap([
      { from: "1", type: "button", button: { payload: `confirm:${TOKEN}` } },
      { from: "2", type: "button", button: { payload: `cancel:${TOKEN}` } },
    ]);
    expect(extractReplies(body)).toHaveLength(2);
  });
});
