import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/crypto/secretbox";
import { integrationsEnv } from "@/lib/env";
import type { Database, Tables } from "@/types/database";

type Admin = SupabaseClient<Database>;
export type PixSettings = Tables<"pix_settings">;

export async function getPixSettings(admin: Admin, professionalId: string) {
  const { data } = await admin
    .from("pix_settings")
    .select("*")
    .eq("professional_id", professionalId)
    .maybeSingle();
  return data;
}

/** Pix pronto para cobrar: habilitado e com os dados do modo escolhido. */
export function isPixReady(settings: PixSettings | null): settings is PixSettings {
  if (!settings?.enabled) return false;
  if (settings.mode === "manual") {
    return Boolean(settings.pix_key && settings.merchant_name && settings.merchant_city);
  }
  return Boolean(settings.mp_access_token_enc && integrationsEnv().PAYMENT_ENCRYPTION_KEY);
}

export function mercadoPagoToken(settings: PixSettings) {
  const key = integrationsEnv().PAYMENT_ENCRYPTION_KEY;
  if (!key || !settings.mp_access_token_enc) throw new Error("Mercado Pago não configurado");
  return decrypt(settings.mp_access_token_enc, key);
}
