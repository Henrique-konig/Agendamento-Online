import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

/** Agendamento público identificado pelo token secreto do link enviado ao cliente. */
export async function getAppointmentByToken(token: string) {
  if (!z.uuid().safeParse(token).success) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      `id, starts_at, ends_at, status, service_name, price_cents, cancel_token,
       payment_status, payment_amount_cents, payment_provider, payment_expires_at, pix_copy_paste,
       client:clients(name),
       professional:professionals(slug, display_name, profession, avatar_path, timezone,
         address_line, neighborhood, city, state, show_address, whatsapp)`,
    )
    .eq("cancel_token", token)
    .maybeSingle();
  return data;
}
