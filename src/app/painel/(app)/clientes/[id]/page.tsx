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
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Cliente" };

export default async function ClientPage(props: PageProps<"/painel/clientes/[id]">) {
  const { id } = await props.params;
  if (!z.uuid().safeParse(id).success) notFound();
  const professional = await requireProfessional();

  const [client, history] = await Promise.all([
    db.client.findFirst({ where: { id, professional_id: professional.id } }),
    db.appointment.findMany({
      where: { client_id: id, professional_id: professional.id },
      select: { id: true, starts_at: true, status: true, service_name: true, price_cents: true },
      orderBy: { starts_at: "desc" },
      take: 50,
    }),
  ]);
  if (!client) notFound();

  const f = dateFormatters(professional.timezone);
  const completed = history.filter((a) => a.status === "completed");
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
          {history.length ? (
            <ul className="divide-y divide-ink-100 text-sm">
              {history.map((a) => (
                <li key={a.id} className="flex justify-between gap-4 py-3">
                  <span>
                    <span className="font-medium text-ink-900">{a.service_name}</span>
                    <span className="block text-ink-500">
                      {capitalize(f.long(a.starts_at))} · {f.time(a.starts_at)}
                    </span>
                  </span>
                  <span className="text-ink-600">{appointmentStatusLabel[a.status]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">Sem agendamentos.</p>
          )}
        </Card>
      </div>
    </>
  );
}
