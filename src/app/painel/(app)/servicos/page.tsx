import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { moveService } from "@/features/services/actions";
import { listOwnServices } from "@/features/services/queries";
import { requireProfessional } from "@/lib/auth";
import { formatDuration, formatServicePrice } from "@/lib/format/money";

export const metadata: Metadata = { title: "Serviços" };

export default async function ServicesPage() {
  const professional = await requireProfessional();
  const services = await listOwnServices(professional.id);

  return (
    <>
      <PageHeader
        title="Serviços"
        description="O que você oferece, com duração e preço."
        actions={<LinkButton href="/painel/servicos/novo">Novo serviço</LinkButton>}
      />
      {services.length ? (
        <Card className="p-0">
          <ul className="divide-ink-100 divide-y">
            {services.map((service, index) => (
              <li key={service.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex flex-col">
                  <MoveButton id={service.id} direction="up" disabled={index === 0} />
                  <MoveButton
                    id={service.id}
                    direction="down"
                    disabled={index === services.length - 1}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/painel/servicos/${service.id}`}
                    className="text-ink-900 font-medium hover:underline"
                  >
                    {service.name}
                  </Link>
                  <p className="text-ink-500 text-sm">
                    {formatDuration(service.duration_minutes)} · {formatServicePrice(service)}
                    {service.requires_quote ? " · orçamento" : ""}
                  </p>
                </div>
                {!service.active ? (
                  <span className="bg-ink-100 text-ink-600 rounded-full px-2 py-0.5 text-xs">
                    Inativo
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card className="text-ink-500 text-center text-sm">
          Nenhum serviço ainda. Cadastre o primeiro para aparecer na sua página.
        </Card>
      )}
    </>
  );
}

function MoveButton({
  id,
  direction,
  disabled,
}: {
  id: string;
  direction: "up" | "down";
  disabled: boolean;
}) {
  return (
    <form action={moveService}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled}
        aria-label={direction === "up" ? "Mover para cima" : "Mover para baixo"}
        className="text-ink-400 hover:text-ink-900 px-1 text-xs leading-none disabled:opacity-30"
      >
        {direction === "up" ? "▲" : "▼"}
      </button>
    </form>
  );
}
