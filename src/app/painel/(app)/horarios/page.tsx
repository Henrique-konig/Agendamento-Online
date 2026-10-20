import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ScheduleSettingsForm } from "@/features/schedule/settings-form";
import { WeeklyEditor } from "@/features/schedule/weekly-editor";
import { requireProfessional } from "@/lib/auth";
import { timeColumnToString } from "@/lib/scheduling/time";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Horários" };

export default async function SchedulePage() {
  const professional = await requireProfessional();
  const rules = await db.availabilityRule.findMany({
    where: { professional_id: professional.id },
    select: { weekday: true, start_time: true, end_time: true },
    orderBy: [{ weekday: "asc" }, { start_time: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Horários"
        description="Defina quando você atende e como os clientes podem agendar."
      />
      <div className="space-y-6">
        <WeeklyEditor
          initialRules={rules.map((r) => ({
            weekday: r.weekday,
            start_time: timeColumnToString(r.start_time),
            end_time: timeColumnToString(r.end_time),
          }))}
        />
        <ScheduleSettingsForm professional={professional} />
      </div>
    </>
  );
}
