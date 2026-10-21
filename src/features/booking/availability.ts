import "server-only";
import { after } from "next/server";
import { expireUnpaid } from "@/features/payments/expire";
import { computeAvailableSlots, isSlotAvailable, type SlotOptions } from "@/lib/scheduling/slots";
import { addDays, instantToLocalDate, zonedToInstant } from "@/lib/scheduling/time";
import { db } from "@/lib/db";
import { timeColumnToString } from "@/lib/scheduling/time";
import type { Professional, Service as ServiceRow } from "@/types/models";
import { collectBusy } from "./busy";
import { emitBookingEvent } from "./notify";

type Service = Pick<ServiceRow, "duration_minutes">;

/** Monta as opções de cálculo (regras + ocupados) para um profissional e serviço. */
export async function loadSlotOptions(
  professional: Professional,
  service: Service,
  now = new Date(),
  excludeAppointmentId?: string,
): Promise<Omit<SlotOptions, "onlyDate">> {
  // Reservas com Pix vencido liberam o horário antes do cálculo.
  const expired = await expireUnpaid(professional.id);
  if (expired.length) {
    after(() =>
      Promise.all(expired.map((id) => emitBookingEvent({ type: "cancelled", appointmentId: id }))),
    );
  }

  const tz = professional.timezone;
  const today = instantToLocalDate(now, tz);
  const from = zonedToInstant(today, 0, tz);
  const to = zonedToInstant(addDays(today, professional.max_days_ahead + 1), 0, tz);

  const [ruleRows, busy] = await Promise.all([
    db.availabilityRule.findMany({
      where: { professional_id: professional.id },
      select: { weekday: true, start_time: true, end_time: true },
    }),
    collectBusy({ professionalId: professional.id, from, to, excludeAppointmentId }),
  ]);
  const rules = ruleRows.map((r) => ({
    weekday: r.weekday,
    start_time: timeColumnToString(r.start_time),
    end_time: timeColumnToString(r.end_time),
  }));

  return {
    rules,
    busy,
    timeZone: tz,
    durationMinutes: service.duration_minutes,
    intervalMinutes: professional.slot_interval_minutes,
    bufferMinutes: professional.buffer_minutes,
    minNoticeMinutes: professional.min_notice_minutes,
    maxDaysAhead: professional.max_days_ahead,
    now,
  };
}

/** `excludeAppointmentId`: ao remarcar, o horário atual do próprio agendamento fica livre. */
export async function getAvailableDays(
  professional: Professional,
  service: Service,
  excludeAppointmentId?: string,
) {
  return computeAvailableSlots(
    await loadSlotOptions(professional, service, new Date(), excludeAppointmentId),
  );
}

export async function checkSlot(
  professional: Professional,
  service: Service,
  start: Date,
  excludeAppointmentId?: string,
) {
  return isSlotAvailable(
    start,
    await loadSlotOptions(professional, service, new Date(), excludeAppointmentId),
  );
}
