import type { Enums } from "@/types/database";

export const appointmentStatusLabel: Record<Enums<"appointment_status">, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Concluído",
  no_show: "Não compareceu",
};

export const appointmentStatusTone: Record<Enums<"appointment_status">, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  confirmed: "bg-brand-50 text-brand-800 ring-brand-200",
  cancelled: "bg-ink-100 text-ink-600 ring-ink-200",
  completed: "bg-sky-50 text-sky-800 ring-sky-200",
  no_show: "bg-red-50 text-red-700 ring-red-200",
};
