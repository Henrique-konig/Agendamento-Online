import "server-only";
import { pushAppointmentToGoogle, removeAppointmentFromGoogle } from "@/features/google/sync";
import { pushBookingEvent } from "@/features/push/notify";
import {
  notifyBookingCancelled,
  notifyBookingCreated,
  notifyPaymentConfirmed,
} from "@/features/notifications/dispatch";

export type BookingEvent = {
  /** paid = pagamento antecipado confirmado (o agendamento passa a confirmado). */
  type: "created" | "cancelled" | "paid";
  appointmentId: string;
};

type Listener = (event: BookingEvent) => Promise<void>;

/**
 * Ganchos executados após mudanças em agendamentos (e-mail, WhatsApp, Google
 * Agenda...). Falhas em um gancho nunca desfazem a reserva.
 */
const listeners: Listener[] = [
  async (event) => {
    if (event.type === "created") await notifyBookingCreated(event.appointmentId);
    else if (event.type === "paid") await notifyPaymentConfirmed(event.appointmentId);
    else await notifyBookingCancelled(event.appointmentId);
  },
  async (event) => {
    if (event.type === "created") await pushAppointmentToGoogle(event.appointmentId);
    else if (event.type === "cancelled") await removeAppointmentFromGoogle(event.appointmentId);
  },
  (event) => pushBookingEvent(event),
];

export async function emitBookingEvent(event: BookingEvent) {
  const results = await Promise.allSettled(listeners.map((listener) => listener(event)));
  for (const result of results) {
    if (result.status === "rejected") console.error("[booking] gancho falhou", result.reason);
  }
}
