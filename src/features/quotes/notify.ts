import "server-only";
import { notifyNewQuote } from "@/features/notifications/dispatch";

export type QuoteEvent = { quoteId: string };

type Listener = (event: QuoteEvent) => Promise<void>;

/** Ganchos executados quando chega um novo pedido de orçamento. */
const listeners: Listener[] = [(event) => notifyNewQuote(event.quoteId)];

export async function emitQuoteEvent(event: QuoteEvent) {
  const results = await Promise.allSettled(listeners.map((listener) => listener(event)));
  for (const result of results) {
    if (result.status === "rejected") console.error("[quotes] gancho falhou", result.reason);
  }
}
