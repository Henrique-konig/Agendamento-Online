import { z } from "zod";
import { contactSchema } from "@/features/booking/schemas";
import { optionalText } from "@/lib/validation/fields";

export const PREFERRED_PERIODS = ["Manhã", "Tarde", "Noite", "Qualquer horário"] as const;

export const quoteSchema = contactSchema.extend({
  slug: z.string().min(3).max(40),
  service_id: z
    .union([z.uuid(), z.literal("")])
    .optional()
    .transform((v) => v || null),
  description: z
    .string()
    .trim()
    .min(10, "Descreva o que você precisa (mínimo de 10 caracteres).")
    .max(3000),
  location: optionalText(200),
  preferred_period: z
    .union([z.enum(PREFERRED_PERIODS), z.literal("")])
    .optional()
    .transform((v) => v || null),
});

export const quoteStatusLabel = {
  new: "Novo",
  contacted: "Em contato",
  scheduled: "Agendado",
  closed: "Encerrado",
} as const;
