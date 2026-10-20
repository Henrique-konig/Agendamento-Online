import { z } from "zod";
import { normalizeBrazilianPhone } from "@/lib/format/contact";
import { optionalText } from "@/lib/validation/fields";

export const phoneField = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const normalized = normalizeBrazilianPhone(v);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Informe DDD + número, ex.: (51) 99999-8888." });
      return z.NEVER;
    }
    return normalized;
  });

export const emailField = optionalText(254).refine(
  (v) => !v || z.email().safeParse(v).success,
  "E-mail inválido.",
);

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  phone: phoneField,
  email: emailField,
  // Honeypot: campo invisível que pessoas não preenchem.
  website: z.string().max(0, "Envio inválido.").optional(),
});

export const bookingSchema = contactSchema.extend({
  slug: z.string().min(3).max(40),
  service_id: z.uuid("Escolha um serviço."),
  starts_at: z.iso.datetime({ offset: true, message: "Escolha um horário." }),
  notes: optionalText(1000),
});

export type BookingInput = z.infer<typeof bookingSchema>;
