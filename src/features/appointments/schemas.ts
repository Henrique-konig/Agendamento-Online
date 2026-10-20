import { z } from "zod";
import { emailField, phoneField } from "@/features/booking/schemas";
import { optionalText } from "@/lib/validation/fields";

export const statusUpdateSchema = z.object({
  id: z.uuid(),
  status: z.enum(["confirmed", "cancelled", "completed", "no_show"]),
});

/** Agendamento lançado pelo próprio profissional (ex.: cliente que pediu pelo WhatsApp). */
export const manualAppointmentSchema = z.object({
  service_id: z.uuid("Escolha um serviço."),
  date: z.iso.date("Informe a data."),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe o horário."),
  name: z.string().trim().min(2, "Informe o nome do cliente.").max(120),
  phone: phoneField,
  email: emailField,
  notes: optionalText(1000),
});
