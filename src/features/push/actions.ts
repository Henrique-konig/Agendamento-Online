"use server";

import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { requireProfessional } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { isAllowedPushEndpoint, pushConfig } from "@/lib/push/config";
import { sendPushToProfessional } from "@/lib/push/send";
import { testPush } from "./payloads";

const base64url = z
  .string()
  .min(8)
  .max(512)
  .regex(/^[A-Za-z0-9_-]+={0,2}$/);

const subscriptionSchema = z.object({
  endpoint: z.url({ protocol: /^https$/ }).max(2048),
  keys: z.object({ p256dh: base64url, auth: base64url }),
});

/** Guarda o aparelho que ativou os avisos (o mesmo endpoint nunca duplica). */
export async function savePushSubscription(subscription: unknown): Promise<ActionState> {
  const professional = await requireProfessional();
  if (!pushConfig())
    return { ok: false, message: "Avisos no celular ainda não foram configurados." };

  const parsed = subscriptionSchema.safeParse(subscription);
  if (!parsed.success || !isAllowedPushEndpoint(parsed.data.endpoint)) {
    return { ok: false, message: "Não foi possível ativar neste aparelho." };
  }

  const userAgent = (await headers()).get("user-agent")?.slice(0, 200) ?? null;
  await db.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    create: {
      professional_id: professional.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      user_agent: userAgent,
    },
    // O aparelho pode trocar de conta: a inscrição passa a valer para quem está logado.
    update: {
      professional_id: professional.id,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      user_agent: userAgent,
    },
  });
  return { ok: true };
}

export async function removePushSubscription(endpoint: string): Promise<ActionState> {
  const professional = await requireProfessional();
  await db.pushSubscription.deleteMany({
    where: { endpoint, professional_id: professional.id },
  });
  return { ok: true };
}

export async function sendTestPush(): Promise<ActionState> {
  const professional = await requireProfessional();
  const result = await sendPushToProfessional(professional.id, testPush);
  if (result.sent) return { ok: true, message: "Enviado! Deve aparecer em instantes." };
  return {
    ok: false,
    message: result.failed
      ? "O envio falhou. Tente desativar e ativar de novo."
      : "Nenhum aparelho ativo. Ative os avisos primeiro.",
  };
}
