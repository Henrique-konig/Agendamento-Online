import type { Metadata } from "next";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { deleteTimeOff } from "@/features/schedule/actions";
import { TimeOffForm } from "@/features/schedule/time-off-form";
import { requireProfessional } from "@/lib/auth";
import { capitalize, dateFormatters } from "@/lib/format/date";
import { instantToLocalDate } from "@/lib/scheduling/time";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Bloqueios" };

export default async function TimeOffPage() {
  const professional = await requireProfessional();
  const supabase = await createClient();
  const { data: blocks } = await supabase
    .from("time_off")
    .select("*")
    .eq("professional_id", professional.id)
    .gt("ends_at", new Date().toISOString())
    .order("starts_at");

  const f = dateFormatters(professional.timezone);
  const today = instantToLocalDate(new Date(), professional.timezone);

  return (
    <>
      <PageHeader title="Bloqueios" description="Períodos em que você não atende." />
      <div className="space-y-6">
        <TimeOffForm today={today} />
        <Card>
          <CardHeader title="Próximos bloqueios" />
          {blocks?.length ? (
            <ul className="divide-y divide-ink-100">
              {blocks.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink-900">
                      {capitalize(f.long(b.starts_at))} {f.time(b.starts_at)} → {f.long(b.ends_at)}{" "}
                      {f.time(b.ends_at)}
                    </p>
                    {b.reason ? <p className="text-xs text-ink-500">{b.reason}</p> : null}
                  </div>
                  <form action={deleteTimeOff}>
                    <input type="hidden" name="id" value={b.id} />
                    <button type="submit" className="text-sm text-red-600 hover:underline">
                      Remover
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">Nenhum bloqueio futuro.</p>
          )}
        </Card>
      </div>
    </>
  );
}
