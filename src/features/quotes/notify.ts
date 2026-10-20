import "server-only";

export type QuoteEvent = { quoteId: string };

type Listener = (event: QuoteEvent) => Promise<void>;

/** Ganchos executados quando chega um novo pedido de orçamento. */
const listeners: Listener[] = [];

export async function emitQuoteEvent(event: QuoteEvent) {
  const results = await Promise.allSettled(listeners.map((listener) => listener(event)));
  for (const result of results) {
    if (result.status === "rejected") console.error("[quotes] gancho falhou", result.reason);
  }
}
