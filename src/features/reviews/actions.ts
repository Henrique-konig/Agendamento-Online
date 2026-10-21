"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPgError, PG } from "@/lib/db-errors";
import { optionalText } from "@/lib/validation/fields";
import { canReview } from "./policy";

const reviewSchema = z.object({
  token: z.uuid(),
  rating: z.coerce
    .number({ message: "Escolha uma nota de 1 a 5." })
    .int()
    .min(1, "Escolha uma nota de 1 a 5.")
    .max(5, "Escolha uma nota de 1 a 5."),
  comment: optionalText(1000),
});

/** Avaliação enviada pelo cliente, a partir do link secreto do agendamento. */
export async function submitReview(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const keep = { comment: String(raw.comment ?? "") };
  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) return { ...fromZodError(parsed.error), values: keep };
  const { token, rating, comment } = parsed.data;

  const appointment = await db.appointment.findUnique({
    where: { cancel_token: token },
    select: {
      id: true,
      professional_id: true,
      client_id: true,
      status: true,
      ends_at: true,
      professional: { select: { slug: true } },
    },
  });
  if (!appointment || !canReview(appointment)) {
    return { ok: false, message: "Este atendimento ainda não pode ser avaliado.", values: keep };
  }

  try {
    await db.review.create({
      data: {
        professional_id: appointment.professional_id,
        appointment_id: appointment.id,
        client_id: appointment.client_id,
        rating,
        comment,
      },
    });
  } catch (error) {
    // appointment_id é único: a segunda tentativa só informa que já foi avaliado.
    if (isPgError(error, PG.UNIQUE)) {
      redirect(`/${appointment.professional.slug}/agendamento/${token}?avaliado=1`);
    }
    console.error("[avaliacoes] falha ao salvar", error);
    return { ok: false, message: "Não foi possível enviar agora. Tente novamente.", values: keep };
  }

  revalidatePath(`/${appointment.professional.slug}`);
  revalidatePath("/painel/avaliacoes");
  redirect(`/${appointment.professional.slug}/agendamento/${token}?avaliado=1`);
}

/** O profissional oculta (ou volta a exibir) uma avaliação na página pública. */
export async function setReviewHidden(formData: FormData): Promise<void> {
  const professional = await requireProfessional();
  const parsed = z
    .object({ id: z.uuid(), hidden: z.enum(["true", "false"]) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  await db.review.updateMany({
    where: { id: parsed.data.id, professional_id: professional.id },
    data: { hidden: parsed.data.hidden === "true" },
  });
  revalidatePath(`/${professional.slug}`);
  revalidatePath("/painel/avaliacoes");
}
