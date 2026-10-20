"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { emitBookingEvent } from "@/features/booking/notify";
import { fromZodError, type ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { encrypt } from "@/lib/crypto/secretbox";
import { integrationsEnv } from "@/lib/env";
import { MercadoPagoError, verifyToken } from "@/lib/pix/mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkbox, optionalText } from "@/lib/validation/fields";
import { markAppointmentPaid } from "./charge";

const settingsSchema = z
  .object({
    enabled: checkbox,
    mode: z.enum(["manual", "mercadopago"]),
    pix_key: optionalText(77),
    merchant_name: optionalText(25),
    merchant_city: optionalText(15),
    mp_access_token: optionalText(200),
    deposit_percent: z.coerce.number().int().min(1).max(100),
    hold_minutes: z.coerce.number().int().min(10).max(1440),
  })
  .superRefine((v, ctx) => {
    if (v.enabled && v.mode === "manual") {
      for (const field of ["pix_key", "merchant_name", "merchant_city"] as const) {
        if (!v[field]) ctx.addIssue({ code: "custom", path: [field], message: "Obrigatório." });
      }
    }
  });

export async function savePixSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const professional = await requireProfessional();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const { mp_access_token, ...values } = parsed.data;

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("pix_settings")
    .select("mp_access_token_enc")
    .eq("professional_id", professional.id)
    .maybeSingle();

  let tokenEnc = current?.mp_access_token_enc ?? null;
  if (mp_access_token) {
    const key = integrationsEnv().PAYMENT_ENCRYPTION_KEY;
    if (!key) return { ok: false, message: "Mercado Pago indisponível nesta instalação." };
    try {
      await verifyToken(mp_access_token);
    } catch (e) {
      const message =
        e instanceof MercadoPagoError && e.status === 401
          ? "Token do Mercado Pago inválido."
          : "Não foi possível validar o token agora.";
      return { ok: false, fieldErrors: { mp_access_token: [message] } };
    }
    tokenEnc = encrypt(mp_access_token, key);
  }

  if (values.enabled && values.mode === "mercadopago" && !tokenEnc) {
    return { ok: false, fieldErrors: { mp_access_token: ["Informe o token de acesso."] } };
  }

  const { error } = await admin.from("pix_settings").upsert({
    professional_id: professional.id,
    ...values,
    mp_access_token_enc: tokenEnc,
  });
  if (error) return { ok: false, message: "Não foi possível salvar." };

  revalidatePath("/painel/pagamentos");
  return { ok: true, message: "Configurações de Pix salvas." };
}

/** Confirmação manual de um Pix recebido (modo copia e cola). */
export async function confirmPixPayment(formData: FormData) {
  const professional = await requireProfessional();
  const id = z.uuid().parse(formData.get("id"));
  const admin = createAdminClient();

  const { data: appointment } = await admin
    .from("appointments")
    .select("id")
    .eq("id", id)
    .eq("professional_id", professional.id)
    .maybeSingle();
  if (!appointment) return;

  if (await markAppointmentPaid(admin, appointment.id)) {
    after(() => emitBookingEvent({ type: "paid", appointmentId: appointment.id }));
  }
  revalidatePath("/painel", "layout");
}
