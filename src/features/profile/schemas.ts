import { z } from "zod";
import { normalizeBrazilianPhone, digits } from "@/lib/format/contact";
import { checkbox, optionalText, UFS } from "@/lib/validation/fields";
import { isValidSlug } from "@/lib/utils/slug";

export const profileSchema = z.object({
  display_name: z.string().trim().min(2, "Informe o nome exibido.").max(80),
  profession: z.string().trim().min(2, "Informe sua profissão.").max(60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isValidSlug, "Use de 3 a 40 letras minúsculas, números ou hífens."),
  bio: optionalText(2000),
  phone: optionalText(20),
  whatsapp: optionalText(20).transform((v, ctx) => {
    if (!v) return null;
    const normalized = normalizeBrazilianPhone(v);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Informe DDD + número, ex.: (51) 99999-8888." });
      return z.NEVER;
    }
    return normalized;
  }),
  contact_email: optionalText(254).refine(
    (v) => !v || z.email().safeParse(v).success,
    "E-mail inválido.",
  ),
  instagram: optionalText(31)
    .transform((v) => (v ? v.replace(/^@/, "") : null))
    .refine((v) => !v || /^[A-Za-z0-9._]{1,30}$/.test(v), "Usuário do Instagram inválido."),
  address_line: optionalText(160),
  neighborhood: optionalText(80),
  city: optionalText(80),
  state: optionalText(2)
    .transform((v) => (v ? v.toUpperCase() : null))
    .refine((v) => !v || (UFS as readonly string[]).includes(v), "UF inválida."),
  postal_code: optionalText(9)
    .transform((v) => (v ? digits(v) : null))
    .refine((v) => !v || v.length === 8, "CEP deve ter 8 dígitos."),
  service_area: optionalText(160),
  show_address: checkbox,
  published: checkbox,
});

export type ProfileInput = z.infer<typeof profileSchema>;
