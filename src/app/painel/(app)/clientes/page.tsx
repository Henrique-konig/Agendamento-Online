import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { requireProfessional } from "@/lib/auth";
import { digits, formatPhoneBR } from "@/lib/format/contact";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientsPage(props: PageProps<"/painel/clientes">) {
  const professional = await requireProfessional();
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim().slice(0, 60) : "";

  const phone = digits(q);
  const clients = await db.client.findMany({
    where: {
      professional_id: professional.id,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              ...(phone.length >= 3 ? [{ phone: { contains: phone } }] : []),
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      _count: { select: { appointments: true } },
    },
    orderBy: { name: "asc" },
    take: 200,
  });

  return (
    <>
      <PageHeader title="Clientes" description="Todos que já agendaram ou pediram orçamento." />
      <form className="mb-4" role="search">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou telefone"
          aria-label="Buscar"
        />
      </form>
      <Card className="p-0">
        {clients.length ? (
          <ul className="divide-y divide-ink-100">
            {clients.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/painel/clientes/${c.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-ink-50"
                >
                  <span>
                    <span className="block font-medium text-ink-900">{c.name}</span>
                    <span className="text-sm text-ink-500">{formatPhoneBR(c.phone)}</span>
                  </span>
                  <span className="text-xs text-ink-500">
                    {c._count.appointments} agendamento(s)
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon="users"
            title={q ? "Nenhum cliente encontrado" : "Ainda sem clientes"}
            text={
              q
                ? "Tente outro nome ou parte do telefone."
                : "Quem agendar ou pedir orçamento entra aqui automaticamente."
            }
          />
        )}
      </Card>
    </>
  );
}
