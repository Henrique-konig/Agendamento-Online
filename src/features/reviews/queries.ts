import "server-only";
import { db } from "@/lib/db";
import { shortName, summarizeRatings, type RatingSummary } from "./summary";

export type PublicReview = {
  id: string;
  name: string;
  rating: number;
  comment: string | null;
  date: Date;
};

/** Avaliações visíveis na página pública: resumo de todas e as mais recentes com comentário. */
export async function getPublicReviews(
  professionalId: string,
  limit = 6,
): Promise<{ summary: RatingSummary; items: PublicReview[] }> {
  const [ratings, latest] = await Promise.all([
    db.review.findMany({
      where: { professional_id: professionalId, hidden: false },
      select: { rating: true },
    }),
    db.review.findMany({
      where: { professional_id: professionalId, hidden: false, comment: { not: null } },
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        id: true,
        rating: true,
        comment: true,
        created_at: true,
        client: { select: { name: true } },
      },
    }),
  ]);
  return {
    summary: summarizeRatings(ratings.map((r) => r.rating)),
    items: latest.map((r) => ({
      id: r.id,
      name: shortName(r.client.name),
      rating: r.rating,
      comment: r.comment,
      date: r.created_at,
    })),
  };
}

export function listReviewsForPanel(professionalId: string) {
  return db.review.findMany({
    where: { professional_id: professionalId },
    orderBy: { created_at: "desc" },
    take: 100,
    select: {
      id: true,
      rating: true,
      comment: true,
      hidden: true,
      created_at: true,
      client: { select: { name: true } },
      appointment: { select: { service_name: true } },
    },
  });
}
