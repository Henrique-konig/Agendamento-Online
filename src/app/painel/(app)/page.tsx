import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireProfessional } from "@/lib/auth";
import { siteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils/cn";
import { AppointmentList } from "@/features/appointments/appointment-list";
import { listAppointments } from "@/features/appointments/queries";
import { addDays, instantToLocalDate, zonedToInstant } from "@/lib/scheduling/time";

export const metadata: Metadata = { title: "Painel" };

export default async function PainelHomePage() {
  const professional = await requireProfessional();
  const publicUrl = siteUrl(`/${professional.slug}`);

  const tz = professional.timezone;
  const today = instantToLocalDate(new Date(), tz);

  const supabase = await createClient();
  const [services, photos, todayAppointments, newQuotes, pendingCount] = await Promise.all([
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", professional.id),
    supabase
      .from("photos")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", professional.id),
    listAppointments(
      professional.id,
      zonedToInstant(today, 0, tz),
      zonedToInstant(addDays(today, 1), 0, tz),
    ),
    supabase
      .from("quote_requests")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", professional.id)
      .eq("status", "new"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", professional.id)
      .eq("status", "pending")
      .gte("starts_at", new Date().toISOString()),
  ]);

  const activeToday = todayAppointments.filter(
    (a) => a.status === "pending" || a.status === "confirmed",
  ).length;
  const stats = [
    { label: "Hoje", value: activeToday, hint: activeToday === 1 ? "atendimento" : "atendimentos" },
    { label: "Aguardando", value: pendingCount.count ?? 0, hint: "para confirmar" },
    { label: "Orçamentos", value: newQuotes.count ?? 0, hint: "novos pedidos" },
  ];

  const checklist = [
    {
      done: Boolean(professional.bio && (professional.whatsapp || professional.phone)),
      label: "Complete seu perfil com apresentação e contato",
      href: "/painel/perfil",
    },
    { done: (services.count ?? 0) > 0, label: "Cadastre seus serviços", href: "/painel/servicos" },
    {
      done: (photos.count ?? 0) > 0,
      label: "Adicione fotos do seu trabalho",
      href: "/painel/fotos",
    },
    { done: professional.published, label: "Publique sua página", href: "/painel/perfil" },
  ];

  return (
    <>
      <PageHeader
        title={`Olá, ${professional.display_name}`}
        description="Acompanhe sua agenda e mantenha sua página atualizada."
        actions={
          professional.published ? (
            <LinkButton href={`/${professional.slug}`} variant="secondary" target="_blank">
              Ver minha página
            </LinkButton>
          ) : null
        }
      />
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "animate-rise rounded-2xl bg-white p-4 shadow-soft ring-1 ring-ink-200/60 sm:p-5",
                i === 1 && "delay-1",
                i === 2 && "delay-2",
              )}
            >
              <p className="font-mono text-[11px] tracking-wider text-ink-400 uppercase">
                {stat.label}
              </p>
              <p className="mt-2 font-display text-4xl font-semibold text-ink-900 tabular-nums">
                {stat.value}
              </p>
              <p className="text-xs text-ink-500">{stat.hint}</p>
            </div>
          ))}
        </div>
        <Card>
          <CardHeader
            title="Hoje"
            description={
              newQuotes.count ? `${newQuotes.count} pedido(s) de orçamento novo(s).` : undefined
            }
            action={
              <Link
                href="/painel/agenda"
                className="text-sm font-medium text-brand-700 hover:underline"
              >
                Ver agenda
              </Link>
            }
          />
          <AppointmentList
            appointments={todayAppointments.filter((a) => a.status !== "cancelled")}
            timeZone={tz}
          />
        </Card>
        <Card>
          <CardHeader
            title="Sua página"
            description={
              professional.published
                ? "Publicada — compartilhe o link com seus clientes e no Google Meu Negócio."
                : "Ainda não publicada."
            }
          />
          <p className="font-mono text-sm break-all text-ink-700">{publicUrl}</p>
        </Card>

        {checklist.some((item) => !item.done) ? (
          <Card>
            <CardHeader title="Primeiros passos" />
            <ol className="space-y-3">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm">
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-5 place-items-center rounded-full text-xs",
                      item.done ? "bg-brand-600 text-white" : "ring-1 ring-ink-300",
                    )}
                  >
                    {item.done ? "✓" : ""}
                  </span>
                  <Link
                    href={item.href}
                    className={cn(item.done ? "text-ink-400 line-through" : "hover:underline")}
                  >
                    {item.label}
                  </Link>
                  <span className="sr-only">{item.done ? "(concluído)" : "(pendente)"}</span>
                </li>
              ))}
            </ol>
          </Card>
        ) : null}
      </div>
    </>
  );
}
