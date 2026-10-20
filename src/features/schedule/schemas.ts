import { z } from "zod";
import { timeToMinutes } from "@/lib/scheduling/time";
import { checkbox } from "@/lib/validation/fields";

export const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido.");

export const ruleSchema = z
  .object({ weekday: z.number().int().min(0).max(6), start_time: time, end_time: time })
  .refine((r) => timeToMinutes(r.end_time) > timeToMinutes(r.start_time), {
    message: "O fim precisa ser depois do início.",
  });

export const rulesSchema = z
  .array(ruleSchema)
  .max(50)
  .superRefine((rules, ctx) => {
    for (let day = 0; day < 7; day++) {
      const sorted = rules
        .filter((r) => r.weekday === day)
        .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
      for (let i = 1; i < sorted.length; i++) {
        if (timeToMinutes(sorted[i].start_time) < timeToMinutes(sorted[i - 1].end_time)) {
          ctx.addIssue({ code: "custom", message: `Faixas sobrepostas em ${WEEKDAYS[day]}.` });
        }
      }
    }
  });

export type Rule = z.infer<typeof ruleSchema>;

export const settingsSchema = z.object({
  booking_enabled: checkbox,
  auto_confirm: checkbox,
  slot_interval_minutes: z.coerce.number().int().min(5).max(240),
  min_notice_minutes: z.coerce.number().int().min(0).max(20160),
  max_days_ahead: z.coerce.number().int().min(1).max(180),
  buffer_minutes: z.coerce.number().int().min(0).max(240),
});

export const timeOffSchema = z
  .object({
    start_date: z.iso.date("Informe a data inicial."),
    end_date: z.iso.date("Informe a data final."),
    all_day: checkbox,
    start_time: z.union([time, z.literal("")]).optional(),
    end_time: z.union([time, z.literal("")]).optional(),
    reason: z.string().trim().max(140).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.end_date < v.start_date) {
      ctx.addIssue({ code: "custom", path: ["end_date"], message: "Data final antes da inicial." });
    }
    if (!v.all_day && (!v.start_time || !v.end_time)) {
      ctx.addIssue({ code: "custom", path: ["start_time"], message: "Informe início e fim." });
    }
    if (
      !v.all_day &&
      v.start_time &&
      v.end_time &&
      v.start_date === v.end_date &&
      v.end_time <= v.start_time
    ) {
      ctx.addIssue({ code: "custom", path: ["end_time"], message: "Fim antes do início." });
    }
  });
