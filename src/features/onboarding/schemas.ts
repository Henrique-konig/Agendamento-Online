import { z } from "zod";
import { isValidSlug } from "@/lib/utils/slug";

export const onboardingSchema = z.object({
  display_name: z.string().trim().min(2, "Informe seu nome ou do seu negócio.").max(80),
  profession: z.string().trim().min(2, "Informe sua profissão.").max(60),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isValidSlug, "Use de 3 a 40 letras minúsculas, números ou hífens."),
});
