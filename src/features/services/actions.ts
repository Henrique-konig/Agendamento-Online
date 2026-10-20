"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { db } from "@/lib/db";
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
  const row = toServiceRow(parsed.data);

  try {
    if (id.success) {
      await db.service.updateMany({
        where: { id: id.data, professional_id: professional.id },
        data: row,
      });
    } else {
      const count = await db.service.count({ where: { professional_id: professional.id } });
      await db.service.create({
        data: { ...row, professional_id: professional.id, position: count },
      });
    }
  } catch (error) {
    console.error("[services] falha ao salvar", error);
    return { ok: false, message: "Não foi possível salvar o serviço." };
  }

  revalidate(professional.slug);
  redirect("/painel/servicos");
}

export async function deleteService(formData: FormData) {
  const professional = await requireProfessional();
  const id = z.uuid().parse(formData.get("id"));
  await db.service.deleteMany({ where: { id, professional_id: professional.id } });
  revalidate(professional.slug);
  redirect("/painel/servicos");
}

/** Move o serviço uma posição para cima ou para baixo na lista. */
export async function moveService(formData: FormData) {
  const professional = await requireProfessional();
  const id = z.uuid().parse(formData.get("id"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));

  const services = await db.service.findMany({
    where: { professional_id: professional.id },
    orderBy: [{ position: "asc" }, { created_at: "asc" }],
    select: { id: true, position: true },
  });

  const index = services.findIndex((s) => s.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= services.length) return;

  const ordered = [...services];
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  await db.$transaction(
    ordered
      .map((s, position) =>
        s.position === position
          ? null
          : db.service.updateMany({
              where: { id: s.id, professional_id: professional.id },
              data: { position },
            }),
      )
      .filter((op) => op !== null),
  );
  revalidate(professional.slug);
}
