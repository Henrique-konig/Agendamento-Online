import "server-only";
import type { BusySource } from "@/features/booking/busy";
import { queryFreeBusy } from "@/lib/google/calendar";
import { withGoogle } from "./connection";

/**
 * Horários ocupados na Google Agenda do profissional. Se o Google estiver
 * indisponível, a agenda continua funcionando só com os dados locais.
 */
export const googleBusySource: BusySource = async (range) => {
  const busy = await withGoogle(
    range.professionalId,
    ({ accessToken, connection }) =>
      queryFreeBusy(accessToken, connection.calendar_id, range.from, range.to),
    { when: (c) => c.sync_busy },
  );
  return busy ?? [];
};
