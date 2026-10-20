"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertClient } from "@/features/clients/upsert";
import { depositAmountCents } from "@/features/payments/amount";
import { createCharge } from "@/features/payments/charge";
import { getPixSettings, isPixReady } from "@/features/payments/settings";
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

  // Pagamento antecipado: só quando o serviço exige, tem preço e o Pix está pronto.
  const pix = service.requires_prepayment ? await getPixSettings(supabase, professional.id) : null;
  const deposit =
    isPixReady(pix) && service.price_cents
      ? depositAmountCents(service.price_cents, pix.deposit_percent)
      : 0;
  if (deposit && pix?.mode === "mercadopago" && !input.email) {
    return { ok: false, fieldErrors: { email: ["Informe seu e-mail para receber o Pix."] } };
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
      // Com Pix, o horário fica reservado (pendente) até o pagamento.
      status: deposit || !professional.auto_confirm ? "pending" : "confirmed",
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

  if (deposit && isPixReady(pix)) {
    try {
      await createCharge(supabase, pix, {
        appointmentId: appointment.id,
        amountCents: deposit,
        description: `${service.name} - ${professional.display_name}`,
        payer: { name: input.name, email: input.email },
        expiresAt: new Date(Date.now() + pix.hold_minutes * MINUTE),
      });
    } catch (e) {
      console.error("[booking] falha ao gerar Pix", e);
      // Sem cobrança, a reserva não se sustenta: libera o horário.
      await supabase.from("appointments").delete().eq("id", appointment.id);
      return { ok: false, message: "Não foi possível gerar o Pix agora. Tente novamente." };
    }
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
    .select("id, starts_at, status, payment_status, professional:professionals(slug)")
    .eq("cancel_token", token.data)
    .maybeSingle();
  if (!appointment || !appointment.professional) return;
  if (!(ACTIVE_STATUSES as readonly string[]).includes(appointment.status)) return;
  if (!canClientCancel(appointment.starts_at)) return;

  await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      // Pix ainda não pago deixa de valer; pagamentos já feitos são devolvidos pelo profissional.
      ...(appointment.payment_status === "pending" ? { payment_status: "expired" as const } : {}),
    })
    .eq("id", appointment.id);

  after(() => emitBookingEvent({ type: "cancelled", appointmentId: appointment.id }));
  revalidatePath("/painel", "layout");
  redirect(`/${appointment.professional.slug}/agendamento/${token.data}`);
}
