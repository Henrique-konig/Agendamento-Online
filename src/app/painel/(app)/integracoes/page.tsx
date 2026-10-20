import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { disconnectGoogle, updateGoogleSettings } from "@/features/google/actions";
import { googleConfig } from "@/features/google/config";
import { requireProfessional } from "@/lib/auth";
import { dateFormatters } from "@/lib/format/date";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Integrações" };

const messages: Record<string, { tone: "success" | "error" | "warning"; text: string }> = {
  conectado: { tone: "success", text: "Google Agenda conectada." },
  cancelado: { tone: "warning", text: "Conexão cancelada." },
  permissoes: {
    tone: "error",
    text: "Precisamos das permissões de agenda. Tente de novo e marque todas as caixas.",
  },
  indisponivel: { tone: "error", text: "A integração com o Google não está configurada." },
  erro: { tone: "error", text: "Não foi possível conectar. Tente novamente." },
};

export default async function IntegrationsPage(props: PageProps<"/painel/integracoes">) {
  const professional = await requireProfessional();
  const searchParams = await props.searchParams;
  const status =
    typeof searchParams.google === "string" ? messages[searchParams.google] : undefined;

  // Leitura pelo servidor, sem expor os tokens ao navegador.
  const { data: connection } = await createAdminClient()
    .from("google_connections")
    .select("google_email, sync_busy, create_events, last_error, last_error_at, created_at")
    .eq("professional_id", professional.id)
    .maybeSingle();
  const available = Boolean(googleConfig());
  const f = dateFormatters(professional.timezone);

  return (
    <>
      <PageHeader title="Integrações" />
      <div className="space-y-6">
        {status ? <Alert tone={status.tone}>{status.text}</Alert> : null}
        <Card>
          <CardHeader
            title="Google Agenda"
            description="Compromissos da sua agenda pessoal bloqueiam horários, e cada novo agendamento vira um evento no Google."
          />
          {connection ? (
            <div className="space-y-5">
              <p className="text-ink-700 text-sm">
                Conectado como <strong>{connection.google_email ?? "conta Google"}</strong> desde{" "}
                {f.short(connection.created_at)}.
              </p>
              {connection.last_error ? (
                <Alert tone="error">
                  {connection.last_error}
                  {connection.last_error_at
                    ? ` (${f.short(connection.last_error_at)} ${f.time(connection.last_error_at)})`
                    : ""}
                </Alert>
              ) : null}
              <form action={updateGoogleSettings} className="space-y-3">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    name="sync_busy"
                    defaultChecked={connection.sync_busy}
                    className="border-ink-300 mt-0.5 size-4 rounded"
                  />
                  <span>
                    <span className="text-ink-900 font-medium">
                      Bloquear horários ocupados no Google
                    </span>
                    <span className="text-ink-500 block">
                      Só vemos se o horário está livre ou ocupado — nunca o conteúdo dos eventos.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    name="create_events"
                    defaultChecked={connection.create_events}
                    className="border-ink-300 mt-0.5 size-4 rounded"
                  />
                  <span className="text-ink-900 font-medium">
                    Criar evento no Google para cada agendamento
                  </span>
                </label>
                <Button type="submit" variant="secondary" size="sm">
                  Salvar preferências
                </Button>
              </form>
              <div className="border-ink-100 flex flex-wrap gap-2 border-t pt-5">
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- route handler com redirect externo (OAuth) */}
                <a href="/api/google/conectar" className={buttonClasses("ghost", "sm")}>
                  Reconectar
                </a>
                <form action={disconnectGoogle}>
                  <Button type="submit" variant="ghost" size="sm" className="text-red-600">
                    Desconectar
                  </Button>
                </form>
              </div>
            </div>
          ) : available ? (
            // eslint-disable-next-line @next/next/no-html-link-for-pages -- route handler com redirect externo (OAuth)
            <a href="/api/google/conectar" className={buttonClasses("primary")}>
              Conectar Google Agenda
            </a>
          ) : (
            <p className="text-ink-500 text-sm">
              Integração ainda não configurada nesta instalação (veja docs/GOOGLE-AGENDA.md).
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
