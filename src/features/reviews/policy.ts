/** Depois que o horário termina, o cliente pode avaliar (concluído ou confirmado que já passou). */
export function canReview(
  appointment: { status: string; ends_at: Date },
  now = new Date(),
): boolean {
  const attended = appointment.status === "completed" || appointment.status === "confirmed";
  return attended && appointment.ends_at.getTime() <= now.getTime();
}

/** A janela do pedido por e-mail: de 3 horas a 48 horas depois do fim do atendimento. */
export const REVIEW_REQUEST_MIN_HOURS = 3;
export const REVIEW_REQUEST_MAX_HOURS = 48;
