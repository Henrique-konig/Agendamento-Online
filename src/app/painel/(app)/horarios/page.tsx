import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ScheduleSettingsForm } from "@/features/schedule/settings-form";
import { WeeklyEditor } from "@/features/schedule/weekly-editor";
import { requireProfessional } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Horários" };

export default async function SchedulePage() {
  const professional = await requireProfessional();
  const supabase = await createClient();
  const { data: rules } = await supabase
    .from("availability_rules")
    .select("weekday, start_time, end_time")
    .eq("professional_id", professional.id)
    .order("weekday")
    .order("start_time");

  return (
    <>
      <PageHeader
        title="Horários"
        description="Defina quando você atende e como os clientes podem agendar."
      />
      <div className="space-y-6">
        <WeeklyEditor
          initialRules={(rules ?? []).map((r) => ({
            weekday: r.weekday,
            start_time: r.start_time.slice(0, 5),
            end_time: r.end_time.slice(0, 5),
          }))}
        />
        <ScheduleSettingsForm professional={professional} />
      </div>
    </>
  );
}
