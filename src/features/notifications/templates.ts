import { formatPhoneBR } from "@/lib/format/contact";
import { capitalize, dateFormatters } from "@/lib/format/date";
import { formatBRL } from "@/lib/format/money";

export type AppointmentContext = {
  appointmentId: string;
  serviceName: string;
  startsAt: string;
  endsAt: string;
  priceCents: number | null;
  status: string;
  paymentStatus?: string;
  paymentAmountCents?: number | null;
  notes: string | null;
  client: { name: string; phone: string; email: string | null };
  professional: {
    displayName: string;
    timezone: string;
    whatsapp: string | null;
    location: string | null;
  };
  manageUrl: string;
  painelUrl: string;
};

export type RenderedEmail = { subject: string; html: string; text: string };

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Detail = [label: string, value: string];

function layout(input: {
  heading: string;
  intro: string;
  details: Detail[];
  cta?: { label: string; url: string };
  footer: string;
}) {
  const rows = input.details
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#64748b;white-space:nowrap">${escapeHtml(label)}</td>` +
        `<td style="padding:6px 0;color:#0f172a;font-weight:600">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
  const button = input.cta
    ? `<p style="margin:28px 0 0"><a href="${escapeHtml(input.cta.url)}" style="background:#059669;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;display:inline-block">${escapeHtml(input.cta.label)}</a></p>`
    : "";

  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;padding:32px;border:1px solid #e2e8f0">
<tr><td>
<h1 style="margin:0 0 12px;font-size:20px;color:#0f172a">${escapeHtml(input.heading)}</h1>
<p style="margin:0 0 20px;color:#334155;line-height:1.5">${escapeHtml(input.intro)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}</table>
${button}
<p style="margin:32px 0 0;font-size:12px;color:#94a3b8">${escapeHtml(input.footer)}</p>
</td></tr></table></td></tr></table></body></html>`;

  const text = [
    input.heading,
    "",
    input.intro,
    "",
    ...input.details.map(([l, v]) => `${l}: ${v}`),
    ...(input.cta ? ["", `${input.cta.label}: ${input.cta.url}`] : []),
    "",
    input.footer,
  ].join("\n");

  return { html, text };
}

function appointmentDetails(ctx: AppointmentContext, extra: Detail[] = []): Detail[] {
  const f = dateFormatters(ctx.professional.timezone);
  return [
    ["Serviço", ctx.serviceName],
    ["Data", capitalize(f.full(ctx.startsAt))],
    ["Horário", `${f.time(ctx.startsAt)} às ${f.time(ctx.endsAt)}`],
    ...(ctx.priceCents != null ? ([["Valor", formatBRL(ctx.priceCents)]] as Detail[]) : []),
    ...(ctx.professional.location ? ([["Local", ctx.professional.location]] as Detail[]) : []),
    ...extra,
  ];
}

const FOOTER = "Mensagem automática enviada pela Agenda Autônomo.";

function paymentDetails(ctx: AppointmentContext): Detail[] {
  if (!ctx.paymentAmountCents) return [];
  const label =
    ctx.paymentStatus === "paid"
      ? "Pago via Pix"
      : ctx.paymentStatus === "pending"
        ? "Pix pendente"
        : "Pix";
  return [[label, formatBRL(ctx.paymentAmountCents)]];
}

export function clientConfirmationEmail(ctx: AppointmentContext): RenderedEmail {
  if (ctx.paymentStatus === "pending") {
    return {
      subject: `Finalize seu agendamento com o Pix — ${ctx.professional.displayName}`,
      ...layout({
        heading: "Falta pouco: pague o Pix",
        intro: `Olá, ${ctx.client.name}! Seu horário está reservado. Ele é confirmado assim que o pagamento via Pix for recebido.`,
        details: appointmentDetails(ctx, paymentDetails(ctx)),
        cta: { label: "Ver código Pix", url: ctx.manageUrl },
        footer: FOOTER,
      }),
    };
  }
  const pending = ctx.status === "pending";
  const subject = pending
    ? `Recebemos seu pedido de agendamento — ${ctx.professional.displayName}`
    : `Agendamento confirmado — ${ctx.professional.displayName}`;
  return {
    subject,
    ...layout({
      heading: pending ? "Pedido recebido" : "Agendamento confirmado",
      intro: pending
        ? `Olá, ${ctx.client.name}! ${ctx.professional.displayName} vai confirmar seu horário em breve.`
        : `Olá, ${ctx.client.name}! Seu horário com ${ctx.professional.displayName} está marcado.`,
      details: appointmentDetails(ctx, paymentDetails(ctx)),
      cta: { label: "Ver ou cancelar agendamento", url: ctx.manageUrl },
      footer: FOOTER,
    }),
  };
}

export function professionalNewBookingEmail(ctx: AppointmentContext): RenderedEmail {
  const f = dateFormatters(ctx.professional.timezone);
  return {
    subject: `Novo agendamento: ${ctx.client.name} — ${f.short(ctx.startsAt)} às ${f.time(ctx.startsAt)}`,
    ...layout({
      heading: "Novo agendamento",
      intro:
        ctx.paymentStatus === "pending"
          ? `${ctx.client.name} reservou um horário e está pagando o Pix.`
          : ctx.paymentStatus === "paid"
            ? `${ctx.client.name} pagou o Pix — horário confirmado.`
            : ctx.status === "pending"
              ? `${ctx.client.name} pediu um horário. Confirme no painel.`
              : `${ctx.client.name} agendou um horário com você.`,
      details: appointmentDetails(ctx, [
        ...paymentDetails(ctx),
        ["Cliente", ctx.client.name],
        ["WhatsApp", formatPhoneBR(ctx.client.phone)],
        ...(ctx.client.email ? ([["E-mail", ctx.client.email]] as Detail[]) : []),
        ...(ctx.notes ? ([["Observações", ctx.notes]] as Detail[]) : []),
      ]),
      cta: { label: "Abrir agenda", url: ctx.painelUrl },
      footer: FOOTER,
    }),
  };
}

export function reminderEmail(ctx: AppointmentContext): RenderedEmail {
  const f = dateFormatters(ctx.professional.timezone);
  return {
    subject: `Lembrete: amanhã às ${f.time(ctx.startsAt)} com ${ctx.professional.displayName}`,
    ...layout({
      heading: "Lembrete do seu agendamento",
      intro: `Olá, ${ctx.client.name}! Passando para lembrar do seu horário amanhã. Se não puder comparecer, cancele pelo link abaixo para liberar o horário.`,
      details: appointmentDetails(ctx),
      cta: { label: "Ver ou cancelar agendamento", url: ctx.manageUrl },
      footer: FOOTER,
    }),
  };
}

export function cancellationEmail(
  ctx: AppointmentContext,
  audience: "client" | "professional",
): RenderedEmail {
  const f = dateFormatters(ctx.professional.timezone);
  const when = `${f.short(ctx.startsAt)} às ${f.time(ctx.startsAt)}`;
  return audience === "client"
    ? {
        subject: `Agendamento cancelado — ${ctx.professional.displayName}`,
        ...layout({
          heading: "Agendamento cancelado",
          intro: `Olá, ${ctx.client.name}. Seu horário de ${when} foi cancelado.`,
          details: appointmentDetails(ctx),
          footer: FOOTER,
        }),
      }
    : {
        subject: `Cancelamento: ${ctx.client.name} — ${when}`,
        ...layout({
          heading: "Agendamento cancelado",
          intro: `O horário de ${ctx.client.name} em ${when} foi cancelado e está livre novamente.`,
          details: appointmentDetails(ctx, [["Cliente", ctx.client.name]]),
          cta: { label: "Abrir agenda", url: ctx.painelUrl },
          footer: FOOTER,
        }),
      };
}

export function newQuoteEmail(input: {
  name: string;
  phone: string;
  email: string | null;
  serviceName: string | null;
  description: string;
  location: string | null;
  preferredPeriod: string | null;
  painelUrl: string;
}): RenderedEmail {
  return {
    subject: `Novo pedido de orçamento: ${input.name}`,
    ...layout({
      heading: "Novo pedido de orçamento",
      intro: input.description,
      details: [
        ["Cliente", input.name],
        ["WhatsApp", formatPhoneBR(input.phone)],
        ...(input.email ? ([["E-mail", input.email]] as Detail[]) : []),
        ...(input.serviceName ? ([["Serviço", input.serviceName]] as Detail[]) : []),
        ...(input.location ? ([["Local", input.location]] as Detail[]) : []),
        ...(input.preferredPeriod ? ([["Período", input.preferredPeriod]] as Detail[]) : []),
      ],
      cta: { label: "Ver orçamentos", url: input.painelUrl },
      footer: FOOTER,
    }),
  };
}

/** Parâmetros do template de WhatsApp, na ordem {{1}}..{{5}}. */
export function reminderWhatsAppParams(ctx: AppointmentContext) {
  const f = dateFormatters(ctx.professional.timezone);
  return [
    ctx.client.name.split(" ")[0],
    ctx.serviceName,
    ctx.professional.displayName,
    `${capitalize(f.long(ctx.startsAt))}, ${f.time(ctx.startsAt)}`,
    ctx.manageUrl,
  ];
}

export function passwordResetEmail(input: {
  link: string;
  expiresInMinutes: number;
}): RenderedEmail {
  return {
    subject: "Redefinir sua senha — Agenda Autônomo",
    ...layout({
      heading: "Redefinir senha",
      intro: `Recebemos um pedido para trocar a senha da sua conta. O link vale por ${input.expiresInMinutes} minutos e só pode ser usado uma vez. Se não foi você, ignore este e-mail: sua senha continua a mesma.`,
      details: [],
      cta: { label: "Escolher nova senha", url: input.link },
      footer: FOOTER,
    }),
  };
}

/** Pedido de avaliação enviado ao cliente depois do atendimento. */
export function reviewRequestEmail(ctx: AppointmentContext): RenderedEmail {
  return {
    subject: `Como foi seu atendimento com ${ctx.professional.displayName}?`,
    ...layout({
      heading: "Como foi o atendimento?",
      intro: `Olá, ${ctx.client.name}! Obrigado por ter vindo. Sua opinião ajuda ${ctx.professional.displayName} a melhorar e ajuda outras pessoas a escolher. Leva menos de um minuto.`,
      details: appointmentDetails(ctx),
      cta: { label: "Avaliar atendimento", url: `${ctx.manageUrl}/avaliar` },
      footer: FOOTER,
    }),
  };
}
