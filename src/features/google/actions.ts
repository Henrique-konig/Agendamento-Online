"use server";

import { revalidatePath } from "next/cache";
import { requireProfessional } from "@/lib/auth";
import { decrypt } from "@/lib/crypto/secretbox";
import { revokeToken } from "@/lib/google/oauth";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkbox } from "@/lib/validation/fields";
import { googleConfig } from "./config";
import { getConnection } from "./connection";

export async function updateGoogleSettings(formData: FormData) {
  const professional = await requireProfessional();
  const admin = createAdminClient();
  await admin
    .from("google_connections")
    .update({
      sync_busy: checkbox.parse(formData.get("sync_busy") ?? undefined),
      create_events: checkbox.parse(formData.get("create_events") ?? undefined),
    })
    .eq("professional_id", professional.id);
  revalidatePath("/painel/integracoes");
}

export async function disconnectGoogle() {
  const professional = await requireProfessional();
  const admin = createAdminClient();
  const connection = await getConnection(admin, professional.id);
  const config = googleConfig();

  if (connection && config) {
    try {
      await revokeToken(decrypt(connection.refresh_token_enc, config.encryptionKey));
    } catch {
      // Mesmo sem revogar, a conexão local é removida.
    }
  }
  await admin.from("google_connections").delete().eq("professional_id", professional.id);
  revalidatePath("/painel/integracoes");
}
