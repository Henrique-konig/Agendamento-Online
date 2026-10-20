import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { appointmentStatusLabel } from "@/features/booking/status";
import { ClientForm } from "@/features/clients/client-form";
import { requireProfessional } from "@/lib/auth";
import { formatPhoneBR, whatsappLink } from "@/lib/format/contact";
import { capitalize, dateFormatters } from "@/lib/format/date";
import { formatBRL } from "@/lib/format/money";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cliente" };

export default async function ClientPage(props: PageProps<"/painel/clientes/[id]">) {
  const { id } = await props.params;
  if (!z.uuid().safeParse(id).success) notFound();
  const professional = await requireProfessional();

  const supabase = await createClient();
  const [{ data: client }, { data: history }] = await Promise.all([
    supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .eq("professional_id", professional.id)
      .maybeSingle(),
    supabase
      .from("appointments")
      .select("id, starts_at, status, service_name, price_cents")
      .eq("client_id", id)
      .eq("professional_id", professional.id)
      .order("starts_at", { ascending: false })
      .limit(50),
  ]);
  if (!client) notFound();

  const f = dateFormatters(professional.timezone);
  const completed = (history ?? []).filter((a) => a.status === "completed");
  const total = completed.reduce((sum, a) => sum + (a.price_cents ?? 0), 0);

  return (
    <>
      <PageHeader
        title={client.name}
        description={`${formatPhoneBR(client.phone)} · ${completed.length} atendimento(s) concluído(s)${total ? ` · ${formatBRL(total)}` : ""}`}
        actions={
          <a
            href={whatsappLink(client.phone, `Olá, ${client.name.split(" ")[0]}!`)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses("secondary")}
          >
            WhatsApp
          </a>
        }
      />
      <div className="space-y-6">
        <Card>
          <ClientForm client={client} />
        </Card>
        <Card>
          <CardHeader title="Histórico" />
          {history?.length ? (
            <ul className="divide-ink-100 divide-y text-sm">
              {history.map((a) => (
                <li key={a.id} className="flex justify-between gap-4 py-3">
                  <span>
                    <span className="text-ink-900 font-medium">{a.service_name}</span>
                    <span className="text-ink-500 block">
                      {capitalize(f.long(a.starts_at))} · {f.time(a.starts_at)}
                    </span>
                  </span>
                  <span className="text-ink-600">{appointmentStatusLabel[a.status]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-500 text-sm">Sem agendamentos.</p>
          )}
        </Card>
      </div>
    </>
  );
}
