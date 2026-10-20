import "server-only";
import { db } from "@/lib/db";

/**
 * Cancela reservas cujo Pix venceu, liberando os horários. Retorna os ids expirados.
 * Uma única instrução com RETURNING: execuções concorrentes não cancelam em dobro.
 */
export async function expireUnpaid(professionalId?: string): Promise<string[]> {
  try {
    const rows = await db.$queryRaw<Array<{ id: string }>>`
      UPDATE "appointments"
         SET status = 'cancelled', payment_status = 'expired', cancelled_at = now()
       WHERE payment_status = 'pending'
         AND status = 'pending'
         AND payment_expires_at < now()
         AND (${professionalId ?? null}::uuid IS NULL OR professional_id = ${professionalId ?? null}::uuid)
      RETURNING id`;
    return rows.map((r) => r.id);
  } catch (error) {
    console.error("[pix] falha ao expirar reservas", error);
    return [];
  }
}
