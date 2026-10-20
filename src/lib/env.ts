import { z } from "zod";

/**
 * Variáveis de ambiente validadas sob demanda. A validação é preguiçosa para
 * que o build não exija credenciais reais.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

function format(error: z.ZodError) {
  return error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

export function publicEnv(): PublicEnv {
  // Referências explícitas para o Next embutir as variáveis no bundle do cliente.
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) throw new Error(`Variáveis de ambiente inválidas: ${format(parsed.error)}`);
  return parsed.data;
}

export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") throw new Error("serverEnv() só pode rodar no servidor");
  const parsed = serverSchema.safeParse({
    ...publicEnv(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  if (!parsed.success) throw new Error(`Variáveis de ambiente inválidas: ${format(parsed.error)}`);
  return parsed.data;
}

export function siteUrl(path = "") {
  return `${publicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}${path}`;
}
