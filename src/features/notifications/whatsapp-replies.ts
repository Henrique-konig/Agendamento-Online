import "server-only";
import { emitBookingEvent } from "@/features/booking/notify";
import { ACTIVE_STATUSES, canClientCancel } from "@/features/booking/policy";
import { capitalize, dateFormatters } from "@/lib/format/date";
import { db } from "@/lib/db";
import { sendWhatsAppText } from "@/lib/notifications/whatsapp";
import type { IncomingReply } from "@/lib/notifications/whatsapp-webhook";
import { siteUrl } from "@/lib/env";

const digits = (value: string) => value.replace(/\D/g, "");
/** Compara só o final do número: a Meta pode entregar o celular brasileiro sem o 9º dígito. */
const sameNumber = (a: string, b: string) => digits(a).slice(-8) === digits(b).slice(-8);

/**
 * Resposta do cliente aos botões do lembrete no WhatsApp.
 * "confirm" registra a presença; "cancel" cancela, com a mesma antecedência do link por e-mail.
 */
export async function handleWhatsAppReply(reply: IncomingReply): Promise<void> {
  const appointment = await db.appointment.findUnique({
    where: { cancel_token: reply.token },
    select: {
      id: true,
      status: true,
      starts_at: true,
      ends_at: true,
      payment_status: true,
      client_confirmed_at: true,
      client: { select: { phone: true } },
      professional: { select: { slug: true, display_name: true, timezone: true } },
    },
  });
  if (!appointment) return;

  // O token vai no botão enviado a este cliente; quem responde precisa ser o mesmo número.
  if (!sameNumber(reply.from, appointment.client.phone)) {
    console.warn("[whatsapp] resposta de número diferente do cliente; ignorada");
    return;
  }

  const { professional } = appointment;
  const f = dateFormatters(professional.timezone);
  const when = `${capitalize(f.full(appointment.starts_at))} às ${f.time(appointment.starts_at)}`;
  const reply_ = (body: string) => sendWhatsAppText({ to: reply.from, body });

  if (!(ACTIVE_STATUSES as readonly string[]).includes(appointment.status)) {
    await reply_("Este agendamento já não está ativo. Se precisar, é só marcar outro horário.");
    return;
  }
  if (appointment.ends_at.getTime() < Date.now()) return;

  if (reply.action === "confirm") {
    if (!appointment.client_confirmed_at) {
      await db.appointment.updateMany({
        where: { id: appointment.id, client_confirmed_at: null },
        data: { client_confirmed_at: new Date() },
      });
    }
    await reply_(`Presença confirmada! Te esperamos ${when} com ${professional.display_name}.`);
    return;
  }

  if (!canClientCancel(appointment.starts_at)) {
    await reply_(
      `Faltam menos de 2 horas para o atendimento, então o cancelamento precisa ser combinado direto com ${professional.display_name}.`,
    );
    return;
  }

  await db.appointment.update({
    where: { id: appointment.id },
    data: {
      status: "cancelled",
      cancelled_at: new Date(),
      // Pix ainda não pago deixa de valer; pagamentos já feitos são devolvidos pelo profissional.
      ...(appointment.payment_status === "pending" ? { payment_status: "expired" } : {}),
    },
  });
  await emitBookingEvent({ type: "cancelled", appointmentId: appointment.id });
  await reply_(
    `Agendamento de ${when} cancelado. Para marcar outro horário: ${siteUrl(`/${professional.slug}`)}`,
  );
}
