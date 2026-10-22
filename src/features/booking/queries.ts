import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";

/** Agendamento público identificado pelo token secreto do link enviado ao cliente. */
export async function getAppointmentByToken(token: string) {
  if (!z.uuid().safeParse(token).success) return null;
  return db.appointment.findUnique({
    where: { cancel_token: token },
    select: {
      id: true,
      professional_id: true,
      starts_at: true,
      ends_at: true,
      status: true,
      service_name: true,
      price_cents: true,
      cancel_token: true,
      payment_status: true,
      payment_amount_cents: true,
      payment_provider: true,
      payment_expires_at: true,
      pix_copy_paste: true,
      client: { select: { name: true } },
      professional: {
        select: {
          slug: true,
          booking_enabled: true,
          display_name: true,
          profession: true,
          avatar_url: true,
          timezone: true,
          address_line: true,
          neighborhood: true,
          city: true,
          state: true,
          show_address: true,
          whatsapp: true,
        },
      },
    },
  });
}
