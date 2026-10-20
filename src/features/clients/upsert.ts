import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type ClientInput = { name: string; phone: string; email?: string | null };

/**
 * Encontra o cliente pelo telefone (chave natural por profissional) ou cria um
 * novo. Atualiza nome/e-mail quando o cliente informa dados mais recentes.
 */
export async function upsertClient(
  supabase: SupabaseClient<Database>,
  professionalId: string,
  input: ClientInput,
) {
  const { data, error } = await supabase
    .from("clients")
    .upsert(
      {
        professional_id: professionalId,
        name: input.name,
        phone: input.phone,
        ...(input.email ? { email: input.email } : {}),
      },
      { onConflict: "professional_id,phone" },
    )
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}
