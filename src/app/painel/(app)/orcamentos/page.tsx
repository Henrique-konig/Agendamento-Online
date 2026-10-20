import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { updateQuoteStatus } from "@/features/quotes/actions";
import { quoteStatusLabel } from "@/features/quotes/schemas";
import { requireProfessional } from "@/lib/auth";
import { formatPhoneBR, whatsappLink } from "@/lib/format/contact";
import { dateFormatters } from "@/lib/format/date";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Orçamentos" };

const statuses = Object.entries(quoteStatusLabel) as Array<[keyof typeof quoteStatusLabel, string]>;

export default async function QuotesPage() {
  const professional = await requireProfessional();
  const quotes = await db.quoteRequest.findMany({
    where: { professional_id: professional.id },
    orderBy: { created_at: "desc" },
    take: 100,
  });

  const f = dateFormatters(professional.timezone);

  return (
    <>
      <PageHeader
        title="Orçamentos"
        description="Pedidos de clientes para serviços que exigem avaliação."
      />
      {quotes.length ? (
        <div className="space-y-4">
          {quotes.map((q) => (
            <Card key={q.id} className={cn(q.status === "new" && "ring-2 ring-brand-500")}>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium text-ink-900">
                    {q.name}
                    {q.service_name ? (
                      <span className="text-ink-500"> · {q.service_name}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-ink-500">
                    {f.short(q.created_at)} às {f.time(q.created_at)}
                    {q.location ? ` · ${q.location}` : ""}
                    {q.preferred_period ? ` · ${q.preferred_period}` : ""}
                  </p>
                  <p className="pt-2 text-sm whitespace-pre-line text-ink-700">{q.description}</p>
                  <p className="pt-2 text-sm">
                    <a
                      href={whatsappLink(
                        q.phone,
                        `Olá, ${q.name.split(" ")[0]}! Sobre seu pedido de orçamento:`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {formatPhoneBR(q.phone)}
                    </a>
                    {q.email ? <span className="text-ink-500"> · {q.email}</span> : null}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1 sm:flex-col">
                  {statuses.map(([value, label]) => (
                    <form key={value} action={updateQuoteStatus}>
                      <input type="hidden" name="id" value={q.id} />
                      <input type="hidden" name="status" value={value} />
                      <button
                        type="submit"
                        disabled={q.status === value}
                        className={cn(
                          "w-full rounded-md px-2.5 py-1 text-xs ring-1 ring-inset",
                          q.status === value
                            ? "bg-ink-900 text-white ring-ink-900"
                            : "text-ink-600 ring-ink-200 hover:bg-ink-50",
                        )}
                      >
                        {label}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon="file"
            title="Nenhum pedido de orçamento"
            text="Marque um serviço como “exige avaliação” e os pedidos chegam aqui."
          />
        </Card>
      )}
    </>
  );
}
