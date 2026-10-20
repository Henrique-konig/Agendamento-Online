"use server";

import { revalidatePath } from "next/cache";
import { requireProfessional } from "@/lib/auth";
import { decrypt } from "@/lib/crypto/secretbox";
import { revokeToken } from "@/lib/google/oauth";
import { db } from "@/lib/db";
import { checkbox } from "@/lib/validation/fields";
import { googleConfig } from "./config";
import { getConnection } from "./connection";

export async function updateGoogleSettings(formData: FormData) {
  const professional = await requireProfessional();
  await db.googleConnection.updateMany({
    where: { professional_id: professional.id },
    data: {
      sync_busy: checkbox.parse(formData.get("sync_busy") ?? undefined),
      create_events: checkbox.parse(formData.get("create_events") ?? undefined),
    },
  });
  revalidatePath("/painel/integracoes");
}

export async function disconnectGoogle() {
  const professional = await requireProfessional();
  const connection = await getConnection(professional.id);
  const config = googleConfig();

  if (connection && config) {
    try {
      await revokeToken(decrypt(connection.refresh_token_enc, config.encryptionKey));
    } catch {
      // Mesmo sem revogar, a conexão local é removida.
    }
  }
  await db.googleConnection.deleteMany({ where: { professional_id: professional.id } });
  revalidatePath("/painel/integracoes");
}
