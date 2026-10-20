"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { db } from "@/lib/db";
import { isPgError, PG } from "@/lib/db-errors";
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

  const professional = await db.professional.findFirst({
    where: { slug: input.slug.toLowerCase(), published: true },
  });
  if (!professional?.booking_enabled) {
    return { ok: false, message: "Este profissional não está aceitando agendamentos online." };
  }

  const service = await db.service.findFirst({
    where: { id: input.service_id, professional_id: professional.id, active: true },
  });
  if (!service || service.requires_quote) {
    return { ok: false, message: "Serviço indisponível para agendamento online." };
  }

  // Pagamento antecipado: só quando o serviço exige, tem preço e o Pix está pronto.
  const pix = service.requires_prepayment ? await getPixSettings(professional.id) : null;
  const deposit =
    isPixReady(pix) && service.price_cents
      ? depositAmountCents(service.price_cents, pix.deposit_percent)
      : 0;
  if (deposit && pix?.mode === "mercadopago" && !input.email) {
    return { ok: false, fieldErrors: { email: ["Informe seu e-mail para receber o Pix."] } };
  }

  const startsAt = new Date(input.starts_at);
  if (!(await checkSlot(professional, service, startsAt))) {
    return { ok: false, message: "Esse horário acabou de ficar indisponível. Escolha outro." };
  }

  const clientId = await upsertClient(professional.id, input);

  const recent = await db.appointment.count({
    where: {
      client_id: clientId,
      source: "online",
      created_at: { gte: new Date(Date.now() - 60 * MINUTE) },
    },
  });
  if (recent >= MAX_BOOKINGS_PER_HOUR) {
    return { ok: false, message: "Muitas reservas em sequência. Fale direto com o profissional." };
  }

  let appointment: { id: string; cancel_token: string };
  try {
    appointment = await db.appointment.create({
      data: {
        professional_id: professional.id,
        client_id: clientId,
        service_id: service.id,
        service_name: service.name,
        price_cents: service.price_cents,
        starts_at: startsAt,
        ends_at: new Date(startsAt.getTime() + service.duration_minutes * MINUTE),
        // Com Pix, o horário fica reservado (pendente) até o pagamento.
        status: deposit || !professional.auto_confirm ? "pending" : "confirmed",
        notes: input.notes,
        source: "online",
      },
      select: { id: true, cancel_token: true },
    });
  } catch (error) {
    // Violação da constraint de sobreposição: outra reserva ocupou o horário.
    if (isPgError(error, PG.EXCLUSION)) {
      return { ok: false, message: "Esse horário acabou de ser reservado. Escolha outro." };
    }
    console.error("[booking] falha ao criar agendamento", error);
    return { ok: false, message: "Não foi possível concluir o agendamento. Tente novamente." };
  }

  if (deposit && isPixReady(pix)) {
    try {
      await createCharge(pix, {
        appointmentId: appointment.id,
        amountCents: deposit,
        description: `${service.name} - ${professional.display_name}`,
        payer: { name: input.name, email: input.email },
        expiresAt: new Date(Date.now() + pix.hold_minutes * MINUTE),
      });
    } catch (e) {
      console.error("[booking] falha ao gerar Pix", e);
      // Sem cobrança, a reserva não se sustenta: libera o horário.
      await db.appointment.delete({ where: { id: appointment.id } });
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

  const appointment = await db.appointment.findUnique({
    where: { cancel_token: token.data },
    select: {
      id: true,
      starts_at: true,
      status: true,
      payment_status: true,
      professional: { select: { slug: true } },
    },
  });
  if (!appointment) return;
  if (!(ACTIVE_STATUSES as readonly string[]).includes(appointment.status)) return;
  if (!canClientCancel(appointment.starts_at)) return;

  await db.appointment.update({
    where: { id: appointment.id },
    data: {
      status: "cancelled",
      cancelled_at: new Date(),
      // Pix ainda não pago deixa de valer; pagamentos já feitos são devolvidos pelo profissional.
      ...(appointment.payment_status === "pending" ? { payment_status: "expired" } : {}),
    },
  });

  after(() => emitBookingEvent({ type: "cancelled", appointmentId: appointment.id }));
  revalidatePath("/painel", "layout");
  redirect(`/${appointment.professional.slug}/agendamento/${token.data}`);
}
