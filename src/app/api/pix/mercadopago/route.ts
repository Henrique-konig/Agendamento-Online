import { NextResponse, type NextRequest } from "next/server";
import { extractPaymentId, handleMercadoPagoNotification } from "@/features/payments/webhook";

export const dynamic = "force-dynamic";

/** Webhook do Mercado Pago (notification_url das cobranças Pix). */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const paymentId = extractPaymentId(body, request.nextUrl.searchParams);
  if (!paymentId) return NextResponse.json({ ok: true, ignored: true });

  try {
    const outcome = await handleMercadoPagoNotification(paymentId);
    return NextResponse.json({ ok: true, outcome });
  } catch (e) {
    console.error("[pix] webhook", paymentId, e);
    // 500 faz o Mercado Pago tentar novamente mais tarde.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
