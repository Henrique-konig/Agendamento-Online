import "server-only";

export type BookingEvent = {
  type: "created" | "cancelled";
  appointmentId: string;
};

type Listener = (event: BookingEvent) => Promise<void>;

/**
 * Ganchos executados após mudanças em agendamentos (e-mail, WhatsApp, Google
 * Agenda...). Falhas em um gancho nunca desfazem a reserva.
 */
const listeners: Listener[] = [];

export async function emitBookingEvent(event: BookingEvent) {
  const results = await Promise.allSettled(listeners.map((listener) => listener(event)));
  for (const result of results) {
    if (result.status === "rejected") console.error("[booking] gancho falhou", result.reason);
  }
}
