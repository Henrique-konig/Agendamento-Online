"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPgError, PG } from "@/lib/db-errors";
import { timeToMinutes, zonedToInstant } from "@/lib/scheduling/time";
import { emitBookingEvent } from "@/features/booking/notify";
import { upsertClient } from "@/features/clients/upsert";
import { manualAppointmentSchema, statusUpdateSchema } from "./schemas";

export async function updateAppointmentStatus(formData: FormData) {
  const professional = await requireProfessional();
  const parsed = statusUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const { id, status } = parsed.data;
  const { count } = await db.appointment.updateMany({
    where: { id, professional_id: professional.id },
    data: { status, cancelled_at: status === "cancelled" ? new Date() : null },
  });

  if (count && status === "cancelled") {
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

  const service = await db.service.findFirst({
    where: { id: v.service_id, professional_id: professional.id },
  });
  if (!service) return { ok: false, fieldErrors: { service_id: ["Serviço não encontrado."] } };

  const startsAt = zonedToInstant(v.date, timeToMinutes(v.time), professional.timezone);
  const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60_000);
  const clientId = await upsertClient(professional.id, v);

  let appointmentId: string;
  try {
    const appointment = await db.appointment.create({
      data: {
        professional_id: professional.id,
        client_id: clientId,
        service_id: service.id,
        service_name: service.name,
        price_cents: service.price_cents,
        starts_at: startsAt,
        ends_at: endsAt,
        status: "confirmed",
        notes: v.notes,
        source: "painel",
      },
      select: { id: true },
    });
    appointmentId = appointment.id;
  } catch (error) {
    if (isPgError(error, PG.EXCLUSION)) {
      return { ok: false, message: "Já existe um compromisso nesse horário." };
    }
    console.error("[agenda] falha ao criar agendamento", error);
    return { ok: false, message: "Não foi possível criar o agendamento." };
  }

  after(() => emitBookingEvent({ type: "created", appointmentId }));
  revalidatePath("/painel", "layout");
  redirect(`/painel/agenda?dia=${v.date}`);
}
