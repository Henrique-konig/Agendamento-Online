"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { addDays, timeToMinutes, zonedToInstant } from "@/lib/scheduling/time";
import { createClient } from "@/lib/supabase/server";
import { rulesSchema, settingsSchema, timeOffSchema } from "./schemas";

export async function saveScheduleSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const professional = await requireProfessional();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("professionals")
    .update(parsed.data)
    .eq("id", professional.id);
  if (error) return { ok: false, message: "Não foi possível salvar." };

  revalidatePath(`/${professional.slug}`);
  revalidatePath("/painel/horarios");
  return { ok: true, message: "Configurações salvas." };
}

export async function saveAvailability(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireProfessional();
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

  const supabase = await createClient();
  const { error } = await supabase.rpc("replace_availability", { rules: parsed.data });
  if (error) return { ok: false, message: "Não foi possível salvar os horários." };

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

  const supabase = await createClient();
  const { error } = await supabase.from("time_off").insert({
    professional_id: professional.id,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    reason: v.reason || null,
  });
  if (error) return { ok: false, message: "Não foi possível criar o bloqueio." };

  revalidatePath("/painel/bloqueios");
  return { ok: true, message: "Bloqueio criado. Esses horários não aparecem mais para clientes." };
}

export async function deleteTimeOff(formData: FormData) {
  const professional = await requireProfessional();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("time_off").delete().eq("id", id).eq("professional_id", professional.id);
  revalidatePath("/painel/bloqueios");
}
