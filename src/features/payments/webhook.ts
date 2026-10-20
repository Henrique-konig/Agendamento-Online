import "server-only";
import { emitBookingEvent } from "@/features/booking/notify";
import { getPayment } from "@/lib/pix/mercadopago";
import { db } from "@/lib/db";
import { markAppointmentPaid } from "./charge";
import { getPixSettings, mercadoPagoToken } from "./settings";

export type WebhookOutcome = "paid" | "ignored" | "not_found";

/**
 * Processa uma notificação do Mercado Pago. O corpo da notificação não é
 * confiável: o status é sempre consultado na API com o token do profissional.
 */
export async function handleMercadoPagoNotification(paymentId: string): Promise<WebhookOutcome> {
  const appointment = await db.appointment.findFirst({
    where: { payment_provider: "mercadopago", payment_provider_id: paymentId },
    select: { id: true, professional_id: true, payment_status: true },
  });
  if (!appointment) return "not_found";
  if (appointment.payment_status !== "pending") return "ignored";

  const settings = await getPixSettings(appointment.professional_id);
  if (!settings?.mp_access_token_enc) return "ignored";

  const payment = await getPayment(mercadoPagoToken(settings), paymentId);
  if (payment.status !== "approved" || payment.external_reference !== appointment.id) {
    return "ignored";
  }

  if (await markAppointmentPaid(appointment.id)) {
    await emitBookingEvent({ type: "paid", appointmentId: appointment.id });
    return "paid";
  }
  return "ignored";
}

/** Extrai o id do pagamento do corpo JSON ou da query string (formatos antigos). */
export function extractPaymentId(body: unknown, searchParams: URLSearchParams): string | null {
  const b = (body ?? {}) as { type?: string; topic?: string; data?: { id?: unknown } };
  const type = b.type ?? b.topic ?? searchParams.get("type") ?? searchParams.get("topic");
  if (type && type !== "payment") return null;
  const id = b.data?.id ?? searchParams.get("data.id") ?? searchParams.get("id");
  const value = id == null ? "" : String(id);
  return /^\d{1,20}$/.test(value) ? value : null;
}
