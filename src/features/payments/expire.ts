import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Cancela reservas cujo Pix venceu, liberando os horários. Retorna os ids expirados. */
export async function expireUnpaid(admin: SupabaseClient<Database>, professionalId?: string) {
  const { data, error } = await admin.rpc("expire_unpaid_appointments", {
    p_professional_id: professionalId ?? null,
  });
  if (error) {
    console.error("[pix] falha ao expirar reservas", error);
    return [];
  }
  return data ?? [];
}
