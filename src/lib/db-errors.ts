/** Códigos SQLSTATE usados pelo app. */
export const PG = {
  UNIQUE: "23505",
  CHECK: "23514",
  EXCLUSION: "23P01",
} as const;

/**
 * Extrai o SQLSTATE original de um erro do Prisma com driver adapter
 * (ex.: 23505 = valor duplicado, 23P01 = horário sobreposto). Retorna null se não for erro do banco.
 */
export function pgCode(error: unknown): string | null {
  const meta = (error as { meta?: { driverAdapterError?: { cause?: { originalCode?: unknown } } } })
    ?.meta;
  const code = meta?.driverAdapterError?.cause?.originalCode;
  if (typeof code === "string") return code;
  return (error as { code?: string })?.code === "P2002" ? PG.UNIQUE : null;
}

export function isPgError(error: unknown, code: string) {
  return pgCode(error) === code;
}
