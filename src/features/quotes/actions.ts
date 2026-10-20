"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { db } from "@/lib/db";
import { upsertClient } from "@/features/clients/upsert";
import { emitQuoteEvent } from "./notify";
import { quoteSchema } from "./schemas";

export async function createQuoteRequest(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = quoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const input = parsed.data;

  const professional = await db.professional.findFirst({
    where: { slug: input.slug.toLowerCase(), published: true },
    select: { id: true },
  });
  if (!professional) return { ok: false, message: "Profissional não encontrado." };

  const service = input.service_id
    ? await db.service.findFirst({
        where: { id: input.service_id, professional_id: professional.id },
        select: { id: true, name: true },
      })
    : null;

  const clientId = await upsertClient(professional.id, input);

  const recent = await db.quoteRequest.count({
    where: { client_id: clientId, created_at: { gte: new Date(Date.now() - 60 * 60_000) } },
  });
  if (recent >= 3) {
    return { ok: false, message: "Recebemos seus pedidos. Aguarde o retorno do profissional." };
  }

  let quote: { id: string };
  try {
    quote = await db.quoteRequest.create({
      data: {
        professional_id: professional.id,
        client_id: clientId,
        service_id: service?.id ?? null,
        service_name: service?.name ?? null,
        name: input.name,
        phone: input.phone,
        email: input.email,
        description: input.description,
        location: input.location,
        preferred_period: input.preferred_period,
      },
      select: { id: true },
    });
  } catch (error) {
    console.error("[quotes] falha ao criar pedido", error);
    return { ok: false, message: "Não foi possível enviar. Tente novamente." };
  }

  after(() => emitQuoteEvent({ quoteId: quote.id }));
  revalidatePath("/painel", "layout");
  return {
    ok: true,
    message: "Pedido enviado! O profissional vai responder pelo WhatsApp ou e-mail informado.",
  };
}

const statusSchema = z.object({
  id: z.uuid(),
  status: z.enum(["new", "contacted", "scheduled", "closed"]),
});

export async function updateQuoteStatus(formData: FormData) {
  const professional = await requireProfessional();
  const parsed = statusSchema.parse(Object.fromEntries(formData));
  await db.quoteRequest.updateMany({
    where: { id: parsed.id, professional_id: professional.id },
    data: { status: parsed.status },
  });
  revalidatePath("/painel/orcamentos");
}
