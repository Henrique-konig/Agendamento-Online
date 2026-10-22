import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { percentChange } from "@/features/reports/compute";
import {
  getReport,
  LAPSED_AFTER_DAYS,
  REPORT_PERIODS,
  type ReportPeriod,
} from "@/features/reports/queries";
import { requireProfessional } from "@/lib/auth";
import { whatsappLink } from "@/lib/format/contact";
import { dateFormatters } from "@/lib/format/date";
import { formatBRL } from "@/lib/format/money";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Relatórios" };

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const periodLabel: Record<ReportPeriod, string> = {
  30: "30 dias",
  90: "90 dias",
  365: "12 meses",
};

/** Mínimo de atendimentos no período anterior para mostrar a variação. */
const MIN_COMPARABLE = 5;

const percent = (value: number) => `${Math.round(value * 100)}%`;

function Delta({ value }: { value: number | null }) {
  if (value === null)
    return <span className="text-ink-400">sem período anterior para comparar</span>;
  if (Math.abs(value) < 0.005)
    return <span className="text-ink-500">igual ao período anterior</span>;
  const up = value > 0;
  return (
    <span className={up ? "text-brand-700" : "text-red-600"}>
      {up ? "▲" : "▼"} {percent(Math.abs(value))} vs. período anterior
    </span>
  );
}

function Bars({ items }: { items: { label: string; value: number; hint?: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-3 text-sm">
          <span className="w-10 shrink-0 text-ink-600 tabular-nums">{item.label}</span>
          <span className="h-3 flex-1 overflow-hidden rounded-full bg-ink-100">
            <span
              className="block h-full rounded-full bg-brand-500"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right text-ink-900 tabular-nums">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function ReportsPage(props: PageProps<"/painel/relatorios">) {
  const [professional, searchParams] = await Promise.all([
    requireProfessional(),
    props.searchParams,
  ]);
  const requested = Number(searchParams.periodo);
  const days = (REPORT_PERIODS as readonly number[]).includes(requested)
    ? (requested as ReportPeriod)
    : 30;

  const { current, previous, lapsed } = await getReport(
    professional.id,
    professional.timezone,
    days,
  );
  const f = dateFormatters(professional.timezone);
  const busiestHours = [...current.byHour].sort((a, b) => b.count - a.count).slice(0, 5);
  const hasData = current.total > 0;

  // Comparar com um período quase vazio gera percentuais sem sentido (ex.: +1300%).
  const comparable = previous.realized >= MIN_COMPARABLE;
  const stats: { label: string; value: string; note: React.ReactNode }[] = [
    {
      label: "Atendimentos",
      value: String(current.realized),
      note: (
        <Delta value={comparable ? percentChange(current.realized, previous.realized) : null} />
      ),
    },
    {
      label: "Receita estimada",
      value: formatBRL(current.revenueCents),
      note: (
        <Delta
          value={comparable ? percentChange(current.revenueCents, previous.revenueCents) : null}
        />
      ),
    },
    {
      label: "Faltas",
      value: current.noShowRate === null ? "—" : percent(current.noShowRate),
      note: `${current.noShow} de ${current.realized + current.noShow}`,
    },
    {
      label: "Cancelamentos",
      value: current.cancelRate === null ? "—" : percent(current.cancelRate),
      note: `${current.cancelled} de ${current.total}`,
    },
  ];

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Como está o seu movimento: o que mais sai, quando e quem sumiu."
        actions={
          <nav aria-label="Período" className="flex rounded-full bg-white p-1 ring-1 ring-ink-200">
            {REPORT_PERIODS.map((period) => (
              <Link
                key={period}
                href={`/painel/relatorios?periodo=${period}`}
                aria-current={period === days ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  period === days ? "bg-brand-700 text-white" : "text-ink-600 hover:text-ink-900",
                )}
              >
                {periodLabel[period]}
              </Link>
            ))}
          </nav>
        }
      />

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-ink-200/60 sm:p-5"
            >
              <p className="font-mono text-[11px] tracking-wider text-ink-400 uppercase">
                {stat.label}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink-900 tabular-nums sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-ink-500">{stat.note}</p>
            </div>
          ))}
        </div>
        <p className="-mt-3 text-xs text-ink-500">
          Atendimentos e receita contam o que já aconteceu: concluídos e confirmados cujo horário
          passou. A receita soma o preço cadastrado de cada serviço.
        </p>

        {hasData ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Dias mais cheios" description="Agendamentos por dia da semana." />
              <Bars items={WEEKDAYS.map((label, i) => ({ label, value: current.byWeekday[i] }))} />
            </Card>
            <Card>
              <CardHeader title="Horários mais pedidos" description="Os 5 que mais se repetem." />
              <Bars
                items={busiestHours.map((h) => ({
                  label: `${String(h.hour).padStart(2, "0")}h`,
                  value: h.count,
                }))}
              />
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader
                title="Serviços"
                description={
                  current.onlineShare === null
                    ? undefined
                    : `${percent(current.onlineShare)} dos agendamentos vieram pela sua página.`
                }
              />
              <ul className="divide-y divide-ink-100 text-sm">
                {current.services.slice(0, 8).map((service) => (
                  <li key={service.name} className="flex items-center justify-between gap-4 py-2.5">
                    <span className="min-w-0 truncate text-ink-900">{service.name}</span>
                    <span className="flex shrink-0 items-center gap-4 text-ink-600 tabular-nums">
                      <span>{service.count}×</span>
                      <span className="w-24 text-right font-medium text-ink-900">
                        {formatBRL(service.revenueCents)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        ) : (
          <Card>
            <p className="text-sm text-ink-600">
              Ainda não há agendamentos nos últimos {periodLabel[days]}. Quando houver, os números
              aparecem aqui.
            </p>
          </Card>
        )}

        <Card>
          <CardHeader
            title="Clientes para reativar"
            description={`Já foram atendidos e não voltam há mais de ${LAPSED_AFTER_DAYS} dias.`}
          />
          {lapsed.length ? (
            <ul className="divide-y divide-ink-100 text-sm">
              {lapsed.map((client) => (
                <li
                  key={client.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                >
                  <span>
                    <Link
                      href={`/painel/clientes/${client.id}`}
                      className="font-medium text-ink-900 hover:underline"
                    >
                      {client.name}
                    </Link>
                    <span className="text-ink-500">
                      {" "}
                      · última visita {f.short(client.lastVisit)}/{client.lastVisit.getFullYear()} ·{" "}
                      {client.visits} {client.visits === 1 ? "visita" : "visitas"}
                    </span>
                  </span>
                  <a
                    href={whatsappLink(
                      client.phone,
                      `Oi, ${client.name.split(" ")[0]}! Faz um tempinho que não te vejo por aqui. Quer marcar um horário?`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-700 hover:underline"
                  >
                    Chamar no WhatsApp
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">Nenhum cliente sumido por enquanto.</p>
          )}
        </Card>
      </div>
    </>
  );
}
