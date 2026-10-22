import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { setReviewHidden } from "@/features/reviews/actions";
import { listReviewsForPanel } from "@/features/reviews/queries";
import { Stars } from "@/features/reviews/stars";
import { summarizeRatings } from "@/features/reviews/summary";
import { requireProfessional } from "@/lib/auth";
import { dateFormatters } from "@/lib/format/date";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Avaliações" };

export default async function ReviewsPage() {
  const professional = await requireProfessional();
  const reviews = await listReviewsForPanel(professional.id);
  const summary = summarizeRatings(reviews.filter((r) => !r.hidden).map((r) => r.rating));
  const f = dateFormatters(professional.timezone);

  return (
    <>
      <PageHeader
        title="Avaliações"
        description="O que seus clientes dizem. As visíveis aparecem na sua página pública."
      />
      <div className="space-y-6">
        {summary.count ? (
          <Card className="flex items-center gap-4">
            <span className="font-display text-4xl font-semibold text-ink-900 tabular-nums">
              {summary.average?.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}
            </span>
            <div>
              <Stars rating={summary.average ?? 0} className="text-xl" />
              <p className="text-sm text-ink-500">
                {summary.count} {summary.count === 1 ? "avaliação visível" : "avaliações visíveis"}
              </p>
            </div>
          </Card>
        ) : null}

        <Card>
          {reviews.length ? (
            <ul className="divide-y divide-ink-100">
              {reviews.map((review) => (
                <li
                  key={review.id}
                  className={cn(
                    "flex flex-col gap-2 py-4 first:pt-0 last:pb-0",
                    review.hidden && "opacity-60",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-3">
                      <Stars rating={review.rating} />
                      <span className="text-sm font-medium text-ink-900">{review.client.name}</span>
                    </span>
                    <span className="text-xs text-ink-400">
                      {review.appointment.service_name} · {f.short(review.created_at)}
                    </span>
                  </div>
                  {review.comment ? (
                    <p className="text-sm leading-relaxed whitespace-pre-line text-ink-700">
                      {review.comment}
                    </p>
                  ) : (
                    <p className="text-sm text-ink-400">Sem comentário.</p>
                  )}
                  <form action={setReviewHidden} className="flex items-center gap-3">
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="hidden" value={String(!review.hidden)} />
                    <button
                      type="submit"
                      className="text-sm font-medium text-brand-700 hover:underline"
                    >
                      {review.hidden ? "Mostrar na página" : "Ocultar da página"}
                    </button>
                    {review.hidden ? (
                      <span className="text-xs text-ink-500">Oculta para o público</span>
                    ) : null}
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-600">
              Ainda não há avaliações. Depois de cada atendimento, o cliente recebe um link por
              e-mail (se informou o e-mail) e também o encontra na página do agendamento.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
