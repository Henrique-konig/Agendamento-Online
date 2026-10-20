import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Interval } from "@/lib/scheduling/slots";
import type { Database } from "@/types/database";

export type BusyRange = { professionalId: string; from: Date; to: Date };

/**
 * Fonte de horários ocupados. Novas integrações (ex.: Google Agenda) entram
 * como fontes adicionais sem alterar o cálculo de horários.
 */
export type BusySource = (
  supabase: SupabaseClient<Database>,
  range: BusyRange,
) => Promise<Interval[]>;

export const appointmentsSource: BusySource = async (supabase, { professionalId, from, to }) => {
  const { data, error } = await supabase
    .from("appointments")
    .select("starts_at, ends_at")
    .eq("professional_id", professionalId)
    .in("status", ["pending", "confirmed"])
    .lt("starts_at", to.toISOString())
    .gt("ends_at", from.toISOString());
  if (error) throw error;
  return data.map((a) => ({ start: new Date(a.starts_at), end: new Date(a.ends_at) }));
};

export const timeOffSource: BusySource = async (supabase, { professionalId, from, to }) => {
  const { data, error } = await supabase
    .from("time_off")
    .select("starts_at, ends_at")
    .eq("professional_id", professionalId)
    .lt("starts_at", to.toISOString())
    .gt("ends_at", from.toISOString());
  if (error) throw error;
  return data.map((t) => ({ start: new Date(t.starts_at), end: new Date(t.ends_at) }));
};

export const busySources: BusySource[] = [appointmentsSource, timeOffSource];

export async function collectBusy(supabase: SupabaseClient<Database>, range: BusyRange) {
  const results = await Promise.all(busySources.map((source) => source(supabase, range)));
  return results.flat();
}
