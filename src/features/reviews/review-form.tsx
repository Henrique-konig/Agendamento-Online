"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { Field, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils/cn";
import { submitReview } from "./actions";

const LABELS = ["Ruim", "Regular", "Bom", "Muito bom", "Excelente"];

export function ReviewForm({ token }: { token: string }) {
  const [state, action] = useActionState(submitReview, initialActionState);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const shown = hover || rating;

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="rating" value={rating || ""} />
      <FormMessage ok={state.ok} message={state.message} />

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ink-900">Sua nota</legend>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}: ${LABELS[n - 1]}`}
              aria-pressed={rating === n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              className={cn(
                "grid size-12 place-items-center rounded-xl text-4xl leading-none transition-transform active:scale-90",
                n <= shown ? "text-amber-400" : "text-ink-200",
              )}
            >
              ★
            </button>
          ))}
          <span className="ml-3 text-sm font-medium text-ink-700" aria-live="polite">
            {shown ? LABELS[shown - 1] : ""}
          </span>
        </div>
        {state.fieldErrors?.rating ? (
          <p className="mt-2 text-xs text-red-600">{state.fieldErrors.rating[0]}</p>
        ) : null}
      </fieldset>

      <Field
        label="Quer contar como foi? (opcional)"
        name="comment"
        errors={state.fieldErrors?.comment}
      >
        <Textarea
          id="comment"
          name="comment"
          rows={4}
          maxLength={1000}
          defaultValue={state.values?.comment}
        />
      </Field>

      <SubmitButton size="lg" className="w-full" disabled={!rating} pendingText="Enviando…">
        {rating ? "Enviar avaliação" : "Escolha uma nota"}
      </SubmitButton>
    </form>
  );
}
