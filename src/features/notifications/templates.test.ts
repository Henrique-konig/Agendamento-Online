import { describe, expect, it } from "vitest";
import {
  clientConfirmationEmail,
  escapeHtml,
  professionalNewBookingEmail,
  reminderEmail,
  reminderWhatsAppParams,
  type AppointmentContext,
} from "./templates";

const ctx: AppointmentContext = {
  appointmentId: "a1",
  serviceName: "Corte <especial>",
  startsAt: "2026-11-03T12:00:00Z",
  endsAt: "2026-11-03T12:30:00Z",
  priceCents: 4500,
  status: "confirmed",
  notes: null,
  client: { name: "Maria Souza", phone: "5551988887777", email: "maria@example.com" },
  professional: {
    displayName: "Barbearia do Zé",
    timezone: "America/Sao_Paulo",
    whatsapp: null,
    location: "Rua A, 10",
  },
  manageUrl: "https://agenda.test/ze/agendamento/tok",
  painelUrl: "https://agenda.test/painel/agenda",
};

describe("templates de e-mail", () => {
  it("escapa HTML de dados do usuário", () => {
    expect(escapeHtml(`<a href="x">'`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;");
    const email = clientConfirmationEmail(ctx);
    expect(email.html).toContain("Corte &lt;especial&gt;");
    expect(email.html).not.toContain("<especial>");
  });

  it("confirmação traz horário local e link de gestão", () => {
    const email = clientConfirmationEmail(ctx);
    expect(email.subject).toBe("Agendamento confirmado — Barbearia do Zé");
    expect(email.text).toContain("Horário: 09:00 às 09:30");
    expect(email.text).toContain(ctx.manageUrl);
  });

  it("aviso ao profissional inclui contato do cliente", () => {
    const email = professionalNewBookingEmail({ ...ctx, status: "pending" });
    expect(email.text).toContain("WhatsApp: (51) 98888-7777");
    expect(email.text).toContain("Confirme no painel");
  });

  it("com Pix pendente, pede o pagamento em vez de confirmar", () => {
    const email = clientConfirmationEmail({
      ...ctx,
      status: "pending",
      paymentStatus: "pending",
      paymentAmountCents: 1500,
    });
    expect(email.subject).toMatch(/^Finalize seu agendamento com o Pix/);
    expect(email.text).toMatch(/Pix pendente: R\$\s15,00/);
  });

  it("lembrete cita o horário de amanhã", () => {
    expect(reminderEmail(ctx).subject).toBe("Lembrete: amanhã às 09:00 com Barbearia do Zé");
  });

  it("parâmetros do WhatsApp seguem a ordem do template", () => {
    expect(reminderWhatsAppParams(ctx)).toEqual([
      "Maria",
      "Corte <especial>",
      "Barbearia do Zé",
      "Terça-feira, 3 de novembro, 09:00",
      ctx.manageUrl,
    ]);
  });
});
