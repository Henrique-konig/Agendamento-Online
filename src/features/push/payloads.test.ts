import { describe, expect, it } from "vitest";
import {
  cancellationPush,
  newBookingPush,
  paymentPush,
  quotePush,
  reschedulePush,
} from "./payloads";

const info = {
  clientName: "Maria Souza",
  startsAt: "2026-11-03T12:00:00Z", // 09:00 em São Paulo
  timeZone: "America/Sao_Paulo",
};

describe("textos das notificações push", () => {
  it("novo agendamento usa o fuso do profissional e abre a agenda", () => {
    const p = newBookingPush(info, false);
    expect(p.title).toBe("Novo agendamento");
    expect(p.body).toBe("Maria Souza — 03/11 às 09:00");
    expect(p.url).toBe("/painel/agenda");
  });

  it("pedido pendente pede confirmação", () => {
    const p = newBookingPush(info, true);
    expect(p.title).toBe("Novo pedido de horário");
    expect(p.body).toContain("confirme no painel");
  });

  it("cancelamento e pagamento", () => {
    expect(cancellationPush(info).title).toBe("Agendamento cancelado");
    expect(paymentPush(info).title).toBe("Pix recebido");
  });

  it("remarcação mostra o novo horário no fuso do profissional", () => {
    const p = reschedulePush(info);
    expect(p.title).toBe("Cliente remarcou");
    expect(p.body).toBe("Maria Souza agora 03/11 às 09:00");
    expect(p.url).toBe("/painel/agenda");
  });

  it("orçamento abre a lista de orçamentos", () => {
    expect(quotePush("João", "Pacote noivo")).toMatchObject({
      body: "João — Pacote noivo",
      url: "/painel/orcamentos",
    });
    expect(quotePush("João", null).body).toBe("João");
  });

  it("todas as URLs são caminhos do próprio painel", () => {
    for (const p of [newBookingPush(info, false), cancellationPush(info), quotePush("a", null)]) {
      expect(p.url.startsWith("/painel")).toBe(true);
    }
  });
});
