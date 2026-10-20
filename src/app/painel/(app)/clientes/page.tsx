import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { requireProfessional } from "@/lib/auth";
import { digits, formatPhoneBR } from "@/lib/format/contact";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientsPage(props: PageProps<"/painel/clientes">) {
  const professional = await requireProfessional();
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim().slice(0, 60) : "";

  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select("id, name, phone, email, appointments(count)")
    .eq("professional_id", professional.id)
    .order("name")
    .limit(200);
  if (q) {
    // Remove caracteres com significado na sintaxe de filtros do PostgREST.
    const safe = q.replace(/[%,()*]/g, " ");
    const phone = digits(q);
    query = query.or(
      phone.length >= 3 ? `name.ilike.%${safe}%,phone.like.%${phone}%` : `name.ilike.%${safe}%`,
    );
  }
  const { data: clients } = await query;

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
        {clients?.length ? (
          <ul className="divide-ink-100 divide-y">
            {clients.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/painel/clientes/${c.id}`}
                  className="hover:bg-ink-50 flex items-center justify-between gap-4 px-6 py-4"
                >
                  <span>
                    <span className="text-ink-900 block font-medium">{c.name}</span>
                    <span className="text-ink-500 text-sm">{formatPhoneBR(c.phone)}</span>
                  </span>
                  <span className="text-ink-500 text-xs">
                    {c.appointments[0]?.count ?? 0} agendamento(s)
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-500 p-6 text-center text-sm">
            {q
              ? "Nenhum cliente encontrado."
              : "Seus clientes aparecem aqui após o primeiro agendamento."}
          </p>
        )}
      </Card>
    </>
  );
}
