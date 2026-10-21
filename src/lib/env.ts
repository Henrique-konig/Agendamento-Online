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

export type EnvProblem = { name: string; message: string };

const integrationKeys = Object.keys(integrationsSchema.shape) as (keyof IntegrationsEnv)[];

/**
 * Lê as integrações opcionais variável por variável: uma variável inválida
 * (ex.: CRON_SECRET curto) desativa só o que depende dela, em vez de derrubar
 * e-mail, lembretes e pagamentos juntos. Os problemas ficam em `envProblems`.
 */
export function readIntegrationsEnv(source: Record<string, string | undefined>): {
  env: IntegrationsEnv;
  problems: EnvProblem[];
} {
  const values: Record<string, unknown> = {};
  const problems: EnvProblem[] = [];
  for (const key of integrationKeys) {
    const raw = source[key] || undefined; // "" conta como ausente
    const result = integrationsSchema.shape[key].safeParse(raw);
    if (result.success) {
      values[key] = result.data;
      continue;
    }
    problems.push({ name: key, message: format(result.error) });
    // Cai no padrão da variável (ou ausente) sem repetir o valor inválido.
    values[key] = integrationsSchema.shape[key].safeParse(undefined).data;
  }
  return { env: values as IntegrationsEnv, problems };
}

let warned = false;

/** Integrações opcionais: cada uma fica desativada se suas variáveis faltarem ou forem inválidas. */
export function integrationsEnv(): IntegrationsEnv {
  const { env, problems } = readIntegrationsEnv(process.env);
  if (problems.length && !warned) {
    warned = true;
    console.error(
      "[env] variáveis ignoradas por serem inválidas:",
      problems.map((p) => `${p.name} (${p.message})`).join("; "),
    );
  }
  return env;
}

/** Variáveis opcionais que estão preenchidas, mas inválidas (para avisar no painel). */
export function envProblems(): EnvProblem[] {
  return readIntegrationsEnv(process.env).problems;
}

/** URL absoluta do site. */
export function siteUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}
