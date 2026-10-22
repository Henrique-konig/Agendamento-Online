/** Antecedência mínima para o cliente cancelar online. */
export const CLIENT_CANCEL_LIMIT_MINUTES = 120;

export function canClientCancel(startsAt: string | Date, now = new Date()) {
  return new Date(startsAt).getTime() - now.getTime() > CLIENT_CANCEL_LIMIT_MINUTES * 60_000;
}

/** Remarcar segue a mesma antecedência do cancelamento. */
export const canClientReschedule = canClientCancel;

export const ACTIVE_STATUSES = ["pending", "confirmed"] as const;
