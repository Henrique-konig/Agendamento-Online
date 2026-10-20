import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listAppointments(professionalId: string, from: Date, to: Date) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, ends_at, status, service_name, price_cents, notes, source, client:clients(id, name, phone)",
    )
    .eq("professional_id", professionalId)
    .gte("starts_at", from.toISOString())
    .lt("starts_at", to.toISOString())
    .order("starts_at");
  if (error) throw error;
  return data;
}

export type AppointmentListItem = Awaited<ReturnType<typeof listAppointments>>[number];
