"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertClient } from "@/features/clients/upsert";
import { checkSlot } from "./availability";
import { emitBookingEvent } from "./notify";
import { ACTIVE_STATUSES, canClientCancel } from "./policy";
import { bookingSchema } from "./schemas";

const MAX_BOOKINGS_PER_HOUR = 3;
const MINUTE = 60_000;

export async function createBooking(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const input = parsed.data;

  const supabase = createAdminClient();
  const { data: professional } = await supabase
    .from("professionals")
    .select("*")
    .eq("slug", input.slug.toLowerCase())
    .eq("published", true)
    .maybeSingle();
  if (!professional?.booking_enabled) {
    return { ok: false, message: "Este profissional não está aceitando agendamentos online." };
  }

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", input.service_id)
    .eq("professional_id", professional.id)
    .eq("active", true)
    .maybeSingle();
  if (!service || service.requires_quote) {
    return { ok: false, message: "Serviço indisponível para agendamento online." };
  }

  const startsAt = new Date(input.starts_at);
  if (!(await checkSlot(supabase, professional, service, startsAt))) {
    return { ok: false, message: "Esse horário acabou de ficar indisponível. Escolha outro." };
  }

  const clientId = await upsertClient(supabase, professional.id, input);

  const { count: recent } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("source", "online")
    .gte("created_at", new Date(Date.now() - 60 * MINUTE).toISOString());
  if ((recent ?? 0) >= MAX_BOOKINGS_PER_HOUR) {
    return { ok: false, message: "Muitas reservas em sequência. Fale direto com o profissional." };
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      professional_id: professional.id,
      client_id: clientId,
      service_id: service.id,
      service_name: service.name,
      price_cents: service.price_cents,
      starts_at: startsAt.toISOString(),
      ends_at: new Date(startsAt.getTime() + service.duration_minutes * MINUTE).toISOString(),
      status: professional.auto_confirm ? "confirmed" : "pending",
      notes: input.notes,
      source: "online",
    })
    .select("id, cancel_token")
    .single();

  if (error) {
    // 23P01 = violação da constraint de sobreposição (reserva simultânea).
    if (error.code === "23P01") {
      return { ok: false, message: "Esse horário acabou de ser reservado. Escolha outro." };
    }
    console.error("[booking] falha ao criar agendamento", error);
    return { ok: false, message: "Não foi possível concluir o agendamento. Tente novamente." };
  }

  after(() => emitBookingEvent({ type: "created", appointmentId: appointment.id }));
  revalidatePath("/painel", "layout");
  redirect(`/${professional.slug}/agendamento/${appointment.cancel_token}`);
}

/** Cancelamento pelo cliente, a partir do link secreto. */
export async function cancelBookingByToken(formData: FormData): Promise<void> {
  const token = z.uuid().safeParse(formData.get("token"));
  if (!token.success) return;

  const supabase = createAdminClient();
  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, starts_at, status, professional:professionals(slug, min_notice_minutes)")
    .eq("cancel_token", token.data)
    .maybeSingle();
  if (!appointment || !appointment.professional) return;
  if (!(ACTIVE_STATUSES as readonly string[]).includes(appointment.status)) return;
  if (!canClientCancel(appointment.starts_at)) return;

  await supabase
    .from("appointments")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", appointment.id);

  after(() => emitBookingEvent({ type: "cancelled", appointmentId: appointment.id }));
  revalidatePath("/painel", "layout");
  redirect(`/${appointment.professional.slug}/agendamento/${token.data}`);
}
