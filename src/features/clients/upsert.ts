import "server-only";
import { db } from "@/lib/db";

type ClientInput = { name: string; phone: string; email?: string | null };

/**
 * Encontra o cliente pelo telefone (chave natural por profissional) ou cria um
 * novo. Atualiza nome/e-mail quando o cliente informa dados mais recentes.
 */
export async function upsertClient(professionalId: string, input: ClientInput) {
  const client = await db.client.upsert({
    where: { professional_id_phone: { professional_id: professionalId, phone: input.phone } },
    create: {
      professional_id: professionalId,
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
    },
    update: { name: input.name, ...(input.email ? { email: input.email } : {}) },
    select: { id: true },
  });
  return client.id;
}
