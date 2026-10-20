import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { siteUrl } from "@/lib/env";
import { buildStaticPix } from "@/lib/pix/brcode";
import { createPixPayment } from "@/lib/pix/mercadopago";
import type { Database } from "@/types/database";
import { mercadoPagoToken, type PixSettings } from "./settings";

type Admin = SupabaseClient<Database>;

type ChargeInput = {
  appointmentId: string;
  amountCents: number;
  description: string;
  payer: { name: string; email: string | null };
  expiresAt: Date;
};

/**
 * Gera a cobrança Pix de um agendamento e grava o "copia e cola" nele.
 * - manual: BR Code estático com a chave do profissional (confirmação no painel)
 * - mercadopago: cobrança dinâmica com confirmação automática por webhook
 */
export async function createCharge(admin: Admin, settings: PixSettings, input: ChargeInput) {
  let copyPaste: string;
  let providerId: string | null = null;

  if (settings.mode === "manual") {
    copyPaste = buildStaticPix({
      key: settings.pix_key!,
      merchantName: settings.merchant_name!,
      merchantCity: settings.merchant_city!,
      amountCents: input.amountCents,
      txid: `AG${input.appointmentId.replace(/-/g, "").slice(0, 20)}`,
      description: input.description,
    });
  } else {
    if (!input.payer.email) throw new Error("E-mail do cliente é obrigatório para o Mercado Pago");
    const payment = await createPixPayment(mercadoPagoToken(settings), {
      amountCents: input.amountCents,
      description: input.description,
      payerEmail: input.payer.email,
      payerName: input.payer.name,
      expiresAt: input.expiresAt,
      notificationUrl: siteUrl("/api/pix/mercadopago"),
      externalReference: input.appointmentId,
      idempotencyKey: `appointment-${input.appointmentId}`,
    });
    const qr = payment.point_of_interaction?.transaction_data?.qr_code;
    if (!qr) throw new Error("Mercado Pago não retornou o código Pix");
    copyPaste = qr;
    providerId = String(payment.id);
  }

  const { error } = await admin
    .from("appointments")
    .update({
      payment_status: "pending",
      payment_provider: settings.mode,
      payment_provider_id: providerId,
      payment_amount_cents: input.amountCents,
      payment_expires_at: input.expiresAt.toISOString(),
      pix_copy_paste: copyPaste,
    })
    .eq("id", input.appointmentId);
  if (error) throw error;
}

/** Marca como pago e confirma o agendamento. Retorna true se mudou o estado. */
export async function markAppointmentPaid(admin: Admin, appointmentId: string) {
  const { data } = await admin
    .from("appointments")
    .update({ payment_status: "paid", status: "confirmed", paid_at: new Date().toISOString() })
    .eq("id", appointmentId)
    .eq("payment_status", "pending")
    .select("id")
    .maybeSingle();
  return Boolean(data);
}
