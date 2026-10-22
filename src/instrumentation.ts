import type { Instrumentation } from "next";
import { buildErrorLog } from "@/lib/observability";

/** Chamado pelo Next.js para todo erro de servidor (páginas, rotas e Server Actions). */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  console.error(JSON.stringify(buildErrorLog(error, request, context)));
};
