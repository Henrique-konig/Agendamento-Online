import { NextResponse, type NextRequest } from "next/server";
import { handleWhatsAppReply } from "@/features/notifications/whatsapp-replies";
import { whatsappWebhookConfig } from "@/lib/notifications/whatsapp-config";
import {
  extractReplies,
  verifyMetaSignature,
  verifyTokenMatches,
} from "@/lib/notifications/whatsapp-webhook";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 256 * 1024;

/** Verificação inicial do webhook (a Meta chama uma vez ao cadastrar a URL). */
export async function GET(request: NextRequest) {
  const config = whatsappWebhookConfig();
  const params = request.nextUrl.searchParams;
  if (
    !config ||
    params.get("hub.mode") !== "subscribe" ||
    !verifyTokenMatches(params.get("hub.verify_token"), config.verifyToken)
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return new NextResponse(params.get("hub.challenge") ?? "", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

/**
 * Eventos do WhatsApp (respostas aos botões do lembrete). A assinatura da Meta é
 * obrigatória; depois dela, respondemos 200 mesmo se uma resposta falhar, porque a
 * Meta reenvia em loop qualquer evento que não receba 200.
 */
export async function POST(request: NextRequest) {
  const config = whatsappWebhookConfig();
  if (!config) return new NextResponse("Not configured", { status: 404 });

  const raw = await request.text();
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES)
    return new NextResponse("Too large", { status: 413 });
  if (!verifyMetaSignature(raw, request.headers.get("x-hub-signature-256"), config.appSecret)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }

  for (const reply of extractReplies(body)) {
    try {
      await handleWhatsAppReply(reply);
    } catch (error) {
      console.error("[whatsapp] falha ao tratar resposta", error);
    }
  }
  return NextResponse.json({ ok: true });
}
