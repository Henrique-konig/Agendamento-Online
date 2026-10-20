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

const integrationsSchema = z.object({
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(3).default("Agenda Autônomo <nao-responda@example.com>"),
  CRON_SECRET: z.string().min(16).optional(),
  WHATSAPP_TOKEN: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  WHATSAPP_REMINDER_TEMPLATE: z.string().min(1).default("lembrete_agendamento"),
  WHATSAPP_TEMPLATE_LANGUAGE: z.string().min(2).default("pt_BR"),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_TOKEN_ENCRYPTION_KEY: z.string().min(1).optional(),
});

export type IntegrationsEnv = z.infer<typeof integrationsSchema>;

/** Integrações opcionais: cada uma fica desativada se suas variáveis faltarem. */
export function integrationsEnv(): IntegrationsEnv {
  const empty = (v: string | undefined) => (v ? v : undefined);
  const parsed = integrationsSchema.safeParse({
    RESEND_API_KEY: empty(process.env.RESEND_API_KEY),
    EMAIL_FROM: empty(process.env.EMAIL_FROM),
    CRON_SECRET: empty(process.env.CRON_SECRET),
    WHATSAPP_TOKEN: empty(process.env.WHATSAPP_TOKEN),
    WHATSAPP_PHONE_NUMBER_ID: empty(process.env.WHATSAPP_PHONE_NUMBER_ID),
    WHATSAPP_REMINDER_TEMPLATE: empty(process.env.WHATSAPP_REMINDER_TEMPLATE),
    WHATSAPP_TEMPLATE_LANGUAGE: empty(process.env.WHATSAPP_TEMPLATE_LANGUAGE),
    GOOGLE_CLIENT_ID: empty(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: empty(process.env.GOOGLE_CLIENT_SECRET),
    GOOGLE_TOKEN_ENCRYPTION_KEY: empty(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY),
  });
  if (!parsed.success) throw new Error(`Variáveis de ambiente inválidas: ${format(parsed.error)}`);
  return parsed.data;
}

/** URL absoluta do site. Não depende das chaves do Supabase. */
export function siteUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}
