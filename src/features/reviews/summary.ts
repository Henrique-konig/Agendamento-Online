export type RatingSummary = {
  count: number;
  /** Média de 1 a 5 com uma casa decimal; null sem avaliações. */
  average: number | null;
  /** Quantidade por nota, índice 0 = nota 1. */
  distribution: [number, number, number, number, number];
};

export function summarizeRatings(ratings: number[]): RatingSummary {
  const distribution: RatingSummary["distribution"] = [0, 0, 0, 0, 0];
  let sum = 0;
  let count = 0;
  for (const rating of ratings) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) continue;
    distribution[rating - 1]++;
    sum += rating;
    count++;
  }
  return { count, average: count ? Math.round((sum / count) * 10) / 10 : null, distribution };
}

/** "Maria Souza Lima" → "Maria S." (a página pública não expõe o nome completo). */
export function shortName(name: string): string {
  const [first, ...rest] = name.trim().split(/\s+/);
  if (!first) return "Cliente";
  const last = rest.at(-1);
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first;
}
