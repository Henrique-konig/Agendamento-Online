/**
 * Registro estruturado de erros do servidor (uma linha JSON por erro), pensado para a
 * busca de logs da Vercel (`request_error`). Privacidade: nunca grava a URL, o corpo
 * nem cabeçalhos — as URLs do app carregam tokens secretos (agendamento, redefinição
 * de senha) —, só o padrão da rota (ex.: /[slug]/agendamento/[token]).
 */
export type ErrorContext = {
  routePath?: string;
  routeType?: string;
  routerKind?: string;
  renderSource?: string;
};

export function buildErrorLog(
  error: unknown,
  request: { method: string },
  context: ErrorContext,
  now = new Date(),
) {
  const e = error as { name?: unknown; message?: unknown; digest?: unknown } | null;
  return {
    level: "error",
    msg: "request_error",
    time: now.toISOString(),
    digest: typeof e?.digest === "string" ? e.digest : undefined,
    name: typeof e?.name === "string" ? e.name : typeof error,
    // Mensagens de erro do banco/Prisma podem citar valores; limita o tamanho e tira quebras.
    message: String(e?.message ?? error)
      .replace(/\s+/g, " ")
      .slice(0, 300),
    method: request.method,
    route: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource,
  };
}
