"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { serviceSchema, toServiceRow } from "./schemas";

function revalidate(slug: string) {
  revalidatePath(`/${slug}`);
  revalidatePath("/painel/servicos");
}

export async function saveService(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const professional = await requireProfessional();
  const parsed = serviceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const id = z.uuid().safeParse(formData.get("id"));
  const supabase = await createClient();
  const row = toServiceRow(parsed.data);

  if (id.success) {
    const { error } = await supabase
      .from("services")
      .update(row)
      .eq("id", id.data)
      .eq("professional_id", professional.id);
    if (error) return { ok: false, message: "Não foi possível salvar o serviço." };
  } else {
    const { count } = await supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", professional.id);
    const { error } = await supabase
      .from("services")
      .insert({ ...row, professional_id: professional.id, position: count ?? 0 });
    if (error) return { ok: false, message: "Não foi possível criar o serviço." };
  }

  revalidate(professional.slug);
  redirect("/painel/servicos");
}

export async function deleteService(formData: FormData) {
  const professional = await requireProfessional();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("services").delete().eq("id", id).eq("professional_id", professional.id);
  revalidate(professional.slug);
  redirect("/painel/servicos");
}

/** Move o serviço uma posição para cima ou para baixo na lista. */
export async function moveService(formData: FormData) {
  const professional = await requireProfessional();
  const id = z.uuid().parse(formData.get("id"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));

  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, position")
    .eq("professional_id", professional.id)
    .order("position")
    .order("created_at");
  if (!services) return;

  const index = services.findIndex((s) => s.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= services.length) return;

  const ordered = [...services];
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  await Promise.all(
    ordered.map((s, position) =>
      s.position === position
        ? null
        : supabase.from("services").update({ position }).eq("id", s.id),
    ),
  );
  revalidate(professional.slug);
}
