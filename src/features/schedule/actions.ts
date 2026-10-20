"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { addDays, timeToMinutes, zonedToInstant } from "@/lib/scheduling/time";
import { db } from "@/lib/db";
import { isPgError, PG } from "@/lib/db-errors";
import { rulesSchema, settingsSchema, timeOffSchema } from "./schemas";

export async function saveScheduleSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const professional = await requireProfessional();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  try {
    await db.professional.update({ where: { id: professional.id }, data: parsed.data });
  } catch (error) {
    console.error("[horarios] falha ao salvar regras", error);
    return { ok: false, message: "Não foi possível salvar." };
  }

  revalidatePath(`/${professional.slug}`);
  revalidatePath("/painel/horarios");
  return { ok: true, message: "Configurações salvas." };
}

export async function saveAvailability(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const professional = await requireProfessional();
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("rules") ?? "[]"));
  } catch {
    return { ok: false, message: "Dados inválidos." };
  }
  const parsed = rulesSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Horários inválidos." };
  }

  try {
    // Substitui todas as faixas de uma vez: ou grava tudo, ou nada.
    await db.$transaction([
      db.availabilityRule.deleteMany({ where: { professional_id: professional.id } }),
      db.availabilityRule.createMany({
        data: parsed.data.map((r) => ({
          professional_id: professional.id,
          weekday: r.weekday,
          start_time: toTimeColumn(r.start_time),
          end_time: toTimeColumn(r.end_time),
        })),
      }),
    ]);
  } catch (error) {
    if (isPgError(error, PG.EXCLUSION)) {
      return { ok: false, message: "Há faixas de horário sobrepostas no mesmo dia." };
    }
    console.error("[horarios] falha ao salvar faixas", error);
    return { ok: false, message: "Não foi possível salvar os horários." };
  }

  revalidatePath("/painel/horarios");
  return { ok: true, message: "Horários de atendimento salvos." };
}

export async function createTimeOff(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const professional = await requireProfessional();
  const parsed = timeOffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const v = parsed.data;
  const tz = professional.timezone;

  const startsAt = v.all_day
    ? zonedToInstant(v.start_date, 0, tz)
    : zonedToInstant(v.start_date, timeToMinutes(v.start_time!), tz);
  const endsAt = v.all_day
    ? zonedToInstant(addDays(v.end_date, 1), 0, tz)
    : zonedToInstant(v.end_date, timeToMinutes(v.end_time!), tz);

  try {
    await db.timeOff.create({
      data: {
        professional_id: professional.id,
        starts_at: startsAt,
        ends_at: endsAt,
        reason: v.reason || null,
      },
    });
  } catch (error) {
    console.error("[bloqueios] falha ao criar", error);
    return { ok: false, message: "Não foi possível criar o bloqueio." };
  }

  revalidatePath("/painel/bloqueios");
  return { ok: true, message: "Bloqueio criado. Esses horários não aparecem mais para clientes." };
}

export async function deleteTimeOff(formData: FormData) {
  const professional = await requireProfessional();
  const id = z.uuid().parse(formData.get("id"));
  await db.timeOff.deleteMany({ where: { id, professional_id: professional.id } });
  revalidatePath("/painel/bloqueios");
}

/** "HH:MM" → valor para coluna TIME do Prisma (Date em UTC na data-base 1970-01-01). */
function toTimeColumn(time: string) {
  return new Date(`1970-01-01T${time}:00.000Z`);
}
