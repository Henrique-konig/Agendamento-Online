"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { timeToMinutes, zonedToInstant } from "@/lib/scheduling/time";
import { createClient } from "@/lib/supabase/server";
import { emitBookingEvent } from "@/features/booking/notify";
import { upsertClient } from "@/features/clients/upsert";
import { manualAppointmentSchema, statusUpdateSchema } from "./schemas";

export async function updateAppointmentStatus(formData: FormData) {
  const professional = await requireProfessional();
  const parsed = statusUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const { id, status } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status, cancelled_at: status === "cancelled" ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("professional_id", professional.id);

  if (!error && status === "cancelled") {
    after(() => emitBookingEvent({ type: "cancelled", appointmentId: id }));
  }
  revalidatePath("/painel", "layout");
}

export async function createManualAppointment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const professional = await requireProfessional();
  const parsed = manualAppointmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const v = parsed.data;

  const supabase = await createClient();
  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", v.service_id)
    .eq("professional_id", professional.id)
    .maybeSingle();
  if (!service) return { ok: false, fieldErrors: { service_id: ["Serviço não encontrado."] } };

  const startsAt = zonedToInstant(v.date, timeToMinutes(v.time), professional.timezone);
  const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60_000);
  const clientId = await upsertClient(supabase, professional.id, v);

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      professional_id: professional.id,
      client_id: clientId,
      service_id: service.id,
      service_name: service.name,
      price_cents: service.price_cents,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "confirmed",
      notes: v.notes,
      source: "painel",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23P01") {
      return { ok: false, message: "Já existe um compromisso nesse horário." };
    }
    return { ok: false, message: "Não foi possível criar o agendamento." };
  }

  after(() => emitBookingEvent({ type: "created", appointmentId: appointment.id }));
  revalidatePath("/painel", "layout");
  redirect(`/painel/agenda?dia=${v.date}`);
}
