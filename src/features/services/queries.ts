import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listOwnServices(professionalId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("professional_id", professionalId)
    .order("position")
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function getOwnService(professionalId: string, id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("id", id)
    .maybeSingle();
  return data;
}
