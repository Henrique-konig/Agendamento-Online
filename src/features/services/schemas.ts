import { z } from "zod";
import { parseBRLToCents } from "@/lib/format/money";
import { checkbox, optionalText } from "@/lib/validation/fields";

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do serviço.").max(80),
  description: optionalText(500),
  duration_minutes: z.coerce
    .number({ message: "Informe a duração." })
    .int()
    .min(5, "Mínimo de 5 minutos.")
    .max(720, "Máximo de 12 horas."),
  price: z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      const cents = parseBRLToCents(v);
      if (cents == null) {
        ctx.addIssue({ code: "custom", message: "Valor inválido. Ex.: 45,00" });
        return z.NEVER;
      }
      return cents;
    }),
  price_is_starting: checkbox,
  requires_quote: checkbox,
  active: checkbox,
});

export type ServiceInput = z.infer<typeof serviceSchema>;

export function toServiceRow(input: ServiceInput) {
  const { price, ...rest } = input;
  return { ...rest, price_cents: price };
}
