"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = createAdminClient();
  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("slug", input.slug.toLowerCase())
    .eq("published", true)
    .maybeSingle();
  if (!professional) return { ok: false, message: "Profissional não encontrado." };

  let serviceName: string | null = null;
  if (input.service_id) {
    const { data: service } = await supabase
      .from("services")
      .select("name")
      .eq("id", input.service_id)
      .eq("professional_id", professional.id)
      .maybeSingle();
    serviceName = service?.name ?? null;
  }

  const clientId = await upsertClient(supabase, professional.id, input);

  const { count } = await supabase
    .from("quote_requests")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .gte("created_at", new Date(Date.now() - 60 * 60_000).toISOString());
  if ((count ?? 0) >= 3) {
    return { ok: false, message: "Recebemos seus pedidos. Aguarde o retorno do profissional." };
  }

  const { data: quote, error } = await supabase
    .from("quote_requests")
    .insert({
      professional_id: professional.id,
      client_id: clientId,
      service_id: serviceName ? input.service_id : null,
      service_name: serviceName,
      name: input.name,
      phone: input.phone,
      email: input.email,
      description: input.description,
      location: input.location,
      preferred_period: input.preferred_period,
    })
    .select("id")
    .single();
  if (error) {
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
  const supabase = await createClient();
  await supabase
    .from("quote_requests")
    .update({ status: parsed.status })
    .eq("id", parsed.id)
    .eq("professional_id", professional.id);
  revalidatePath("/painel/orcamentos");
}
