import "server-only";
import { db } from "@/lib/db";
import { sendPushToProfessional } from "@/lib/push/send";
import { cancellationPush, newBookingPush, paymentPush, quotePush } from "./payloads";

type BookingPushEvent = { type: "created" | "cancelled" | "paid"; appointmentId: string };

/** Avisa o profissional, nos aparelhos que ativaram o push, sobre mudanças em agendamentos. */
export async function pushBookingEvent(event: BookingPushEvent) {
  const appointment = await db.appointment.findUnique({
    where: { id: event.appointmentId },
    select: {
      status: true,
      starts_at: true,
      professional_id: true,
      client: { select: { name: true } },
      professional: { select: { timezone: true, notify_new_booking: true } },
    },
  });
  if (!appointment?.professional.notify_new_booking) return;

  const info = {
    clientName: appointment.client.name,
    startsAt: appointment.starts_at,
    timeZone: appointment.professional.timezone,
  };
  const payload =
    event.type === "created"
      ? newBookingPush(info, appointment.status === "pending")
      : event.type === "paid"
        ? paymentPush(info)
        : cancellationPush(info);
  await sendPushToProfessional(appointment.professional_id, payload);
}

export async function pushNewQuote(quoteId: string) {
  const quote = await db.quoteRequest.findUnique({
    where: { id: quoteId },
    select: {
      name: true,
      service_name: true,
      professional_id: true,
      professional: { select: { notify_new_booking: true } },
    },
  });
  if (!quote?.professional.notify_new_booking) return;
  await sendPushToProfessional(quote.professional_id, quotePush(quote.name, quote.service_name));
}
