const API = "https://api.mercadopago.com";

export class MercadoPagoError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export type MercadoPagoPayment = {
  id: number;
  status:
    | "pending"
    | "approved"
    | "authorized"
    | "in_process"
    | "rejected"
    | "cancelled"
    | "refunded"
    | "charged_back";
  external_reference: string | null;
  transaction_amount: number;
  point_of_interaction?: {
    transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string };
  };
};

async function call<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new MercadoPagoError(body?.message ?? `HTTP ${response.status}`, response.status);
  }
  return body as T;
}

/** Cria uma cobrança Pix (https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post). */
export function createPixPayment(
  token: string,
  input: {
    amountCents: number;
    description: string;
    payerEmail: string;
    payerName: string;
    expiresAt: Date;
    notificationUrl?: string;
    externalReference: string;
    idempotencyKey: string;
  },
) {
  const [firstName, ...rest] = input.payerName.trim().split(/\s+/);
  return call<MercadoPagoPayment>(token, "/v1/payments", {
    method: "POST",
    headers: { "X-Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify({
      transaction_amount: input.amountCents / 100,
      description: input.description.slice(0, 120),
      payment_method_id: "pix",
      payer: {
        email: input.payerEmail,
        first_name: firstName,
        last_name: rest.join(" ") || undefined,
      },
      date_of_expiration: input.expiresAt.toISOString().replace("Z", "+00:00"),
      external_reference: input.externalReference,
      ...(input.notificationUrl ? { notification_url: input.notificationUrl } : {}),
    }),
  });
}

export function getPayment(token: string, paymentId: string) {
  return call<MercadoPagoPayment>(token, `/v1/payments/${encodeURIComponent(paymentId)}`);
}

/** Valida o token chamando um endpoint barato da conta. */
export async function verifyToken(token: string) {
  await call(token, "/users/me");
}
