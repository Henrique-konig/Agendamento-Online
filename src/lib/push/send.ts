import "server-only";
import webpush from "web-push";
import { db } from "@/lib/db";
import { isAllowedPushEndpoint, pushConfig } from "./config";

export type PushPayload = {
  title: string;
  body: string;
  /** Caminho aberto ao tocar na notificação. */
  url: string;
  /** Notificações com a mesma tag substituem uma à outra. */
  tag?: string;
};

export type PushResult = { sent: number; removed: number; failed: number };

/** Envia a notificação para todos os aparelhos do profissional e limpa os que expiraram. */
export async function sendPushToProfessional(
  professionalId: string,
  payload: PushPayload,
): Promise<PushResult> {
  const config = pushConfig();
  const result: PushResult = { sent: 0, removed: 0, failed: 0 };
  if (!config) return result;

  const stored = await db.pushSubscription.findMany({
    where: { professional_id: professionalId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  // Defesa em profundidade: mesmo uma linha antiga no banco só é usada se o host for de um serviço de push.
  const subscriptions = stored.filter((s) => isAllowedPushEndpoint(s.endpoint));
  if (!subscriptions.length) return result;

  const options = {
    vapidDetails: {
      subject: config.subject,
      publicKey: config.publicKey,
      privateKey: config.privateKey,
    },
    TTL: 60 * 60 * 12,
    urgency: "high" as const,
  };
  const body = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          body,
          options,
        );
        result.sent++;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // 404/410: o aparelho cancelou ou a inscrição expirou; não adianta insistir.
        if (status === 404 || status === 410) {
          await db.pushSubscription.deleteMany({ where: { id: subscription.id } });
          result.removed++;
        } else {
          result.failed++;
          console.error("[push] falha ao enviar", status ?? error);
        }
      }
    }),
  );
  return result;
}
