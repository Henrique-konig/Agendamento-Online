import { cn } from "@/lib/utils/cn";

/** Estrelas só de leitura; o texto acessível diz a nota por extenso. */
export function Stars({ rating, className }: { rating: number; className?: string }) {
  // 4,5 mostra 4 cheias (a média exata aparece em número ao lado); 4,75 ou mais mostra 5.
  const filled = Math.floor(rating + 0.25);
  return (
    <span
      role="img"
      aria-label={`${rating} de 5 estrelas`}
      className={cn("inline-flex gap-0.5 text-amber-400", className)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden className={n <= filled ? "" : "text-ink-200"}>
          ★
        </span>
      ))}
    </span>
  );
}
