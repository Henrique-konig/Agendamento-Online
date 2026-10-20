import { z } from "zod";

/** Texto opcional: string vazia vira null. */
export function optionalText(max: number, message?: string) {
  return z
    .string()
    .trim()
    .max(max, message ?? `Máximo de ${max} caracteres.`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);
}

/** Checkbox de formulário HTML: "on" quando marcado, ausente quando não. */
export const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.undefined(), z.null()])
  .transform((v) => v === "on" || v === "true");

export const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;
