import "server-only";
import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { expireUnpaid } from "@/features/payments/expire";
import { computeAvailableSlots, isSlotAvailable, type SlotOptions } from "@/lib/scheduling/slots";
import { addDays, instantToLocalDate, zonedToInstant } from "@/lib/scheduling/time";
import type { Database, Tables } from "@/types/database";
import { collectBusy } from "./busy";
import { emitBookingEvent } from "./notify";

type Professional = Tables<"professionals">;
type Service = Pick<Tables<"services">, "duration_minutes">;

/** Monta as opções de cálculo (regras + ocupados) para um profissional e serviço. */
export async function loadSlotOptions(
  supabase: SupabaseClient<Database>,
  professional: Professional,
  service: Service,
  now = new Date(),
): Promise<Omit<SlotOptions, "onlyDate">> {
  // Reservas com Pix vencido liberam o horário antes do cálculo.
  const expired = await expireUnpaid(supabase, professional.id);
  if (expired.length) {
    after(() =>
      Promise.all(expired.map((id) => emitBookingEvent({ type: "cancelled", appointmentId: id }))),
    );
  }

  const tz = professional.timezone;
  const today = instantToLocalDate(now, tz);
  const from = zonedToInstant(today, 0, tz);
  const to = zonedToInstant(addDays(today, professional.max_days_ahead + 1), 0, tz);

  const [{ data: rules, error }, busy] = await Promise.all([
    supabase
      .from("availability_rules")
      .select("weekday, start_time, end_time")
      .eq("professional_id", professional.id),
    collectBusy(supabase, { professionalId: professional.id, from, to }),
  ]);
  if (error) throw error;

  return {
    rules,
    busy,
    timeZone: tz,
    durationMinutes: service.duration_minutes,
    intervalMinutes: professional.slot_interval_minutes,
    bufferMinutes: professional.buffer_minutes,
    minNoticeMinutes: professional.min_notice_minutes,
    maxDaysAhead: professional.max_days_ahead,
    now,
  };
}

export async function getAvailableDays(
  supabase: SupabaseClient<Database>,
  professional: Professional,
  service: Service,
) {
  return computeAvailableSlots(await loadSlotOptions(supabase, professional, service));
}

export async function checkSlot(
  supabase: SupabaseClient<Database>,
  professional: Professional,
  service: Service,
  start: Date,
) {
  return isSlotAvailable(start, await loadSlotOptions(supabase, professional, service));
}
