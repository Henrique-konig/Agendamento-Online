import { dateFormatters } from "@/lib/format/date";
import type { PushPayload } from "@/lib/push/send";

type AppointmentInfo = {
  clientName: string;
  startsAt: Date | string;
  timeZone: string;
};

function when({ startsAt, timeZone }: AppointmentInfo) {
  const f = dateFormatters(timeZone);
  return `${f.short(startsAt)} às ${f.time(startsAt)}`;
}

export function newBookingPush(a: AppointmentInfo, pending: boolean): PushPayload {
  return {
    title: pending ? "Novo pedido de horário" : "Novo agendamento",
    body: `${a.clientName} — ${when(a)}${pending ? " (confirme no painel)" : ""}`,
    url: "/painel/agenda",
    tag: "agenda",
  };
}

export function cancellationPush(a: AppointmentInfo): PushPayload {
  return {
    title: "Agendamento cancelado",
    body: `${a.clientName} — ${when(a)}`,
    url: "/painel/agenda",
    tag: "agenda",
  };
}

export function reschedulePush(a: AppointmentInfo): PushPayload {
  return {
    title: "Cliente remarcou",
    body: `${a.clientName} agora ${when(a)}`,
    url: "/painel/agenda",
    tag: "agenda",
  };
}

export function paymentPush(a: AppointmentInfo): PushPayload {
  return {
    title: "Pix recebido",
    body: `${a.clientName} pagou o sinal — ${when(a)}`,
    url: "/painel/agenda",
    tag: "agenda",
  };
}

export function quotePush(name: string, serviceName: string | null): PushPayload {
  return {
    title: "Novo pedido de orçamento",
    body: serviceName ? `${name} — ${serviceName}` : name,
    url: "/painel/orcamentos",
    tag: "orcamentos",
  };
}

export const testPush: PushPayload = {
  title: "Avisos ligados neste aparelho",
  body: "Você vai receber novos agendamentos e pedidos aqui.",
  url: "/painel",
  tag: "teste",
};
