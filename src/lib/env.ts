import { z } from "zod";

/**
 * Variáveis de ambiente validadas sob demanda. A validação é preguiçosa para
 * que o build não exija credenciais reais.
 */
function format(error: z.ZodError) {
  return error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

const integrationsSchema = z.object({
  // E-mail: SMTP (Gmail, Brevo, SES...) tem prioridade; Resend por API é a alternativa.
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(465),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(3).default("Agenda Autônomo <nao-responda@example.com>"),
  CRON_SECRET: z.string().min(16).optional(),
  WHATSAPP_TOKEN: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  WHATSAPP_REMINDER_TEMPLATE: z.string().min(1).default("lembrete_agendamento"),
  WHATSAPP_TEMPLATE_LANGUAGE: z.string().min(2).default("pt_BR"),
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_TOKEN_ENCRYPTION_KEY: z.string().min(1).optional(),
  PAYMENT_ENCRYPTION_KEY: z.string().min(1).optional(),
});

export type IntegrationsEnv = z.infer<typeof integrationsSchema>;

/** Integrações opcionais: cada uma fica desativada se suas variáveis faltarem. */
export function integrationsEnv(): IntegrationsEnv {
  const empty = (v: string | undefined) => (v ? v : undefined);
  const parsed = integrationsSchema.safeParse({
    SMTP_HOST: empty(process.env.SMTP_HOST),
    SMTP_PORT: empty(process.env.SMTP_PORT),
    SMTP_USER: empty(process.env.SMTP_USER),
    SMTP_PASSWORD: empty(process.env.SMTP_PASSWORD),
    RESEND_API_KEY: empty(process.env.RESEND_API_KEY),
    EMAIL_FROM: empty(process.env.EMAIL_FROM),
    CRON_SECRET: empty(process.env.CRON_SECRET),
    WHATSAPP_TOKEN: empty(process.env.WHATSAPP_TOKEN),
    WHATSAPP_PHONE_NUMBER_ID: empty(process.env.WHATSAPP_PHONE_NUMBER_ID),
    WHATSAPP_REMINDER_TEMPLATE: empty(process.env.WHATSAPP_REMINDER_TEMPLATE),
    WHATSAPP_TEMPLATE_LANGUAGE: empty(process.env.WHATSAPP_TEMPLATE_LANGUAGE),
    BLOB_READ_WRITE_TOKEN: empty(process.env.BLOB_READ_WRITE_TOKEN),
    GOOGLE_CLIENT_ID: empty(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: empty(process.env.GOOGLE_CLIENT_SECRET),
    GOOGLE_TOKEN_ENCRYPTION_KEY: empty(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY),
    PAYMENT_ENCRYPTION_KEY: empty(process.env.PAYMENT_ENCRYPTION_KEY),
  });
  if (!parsed.success) throw new Error(`Variáveis de ambiente inválidas: ${format(parsed.error)}`);
  return parsed.data;
}

/** URL absoluta do site. */
export function siteUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}
