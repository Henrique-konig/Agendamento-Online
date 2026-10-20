import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { deleteService } from "@/features/services/actions";
import { getOwnService } from "@/features/services/queries";
import { ServiceForm } from "@/features/services/service-form";
import { requireProfessional } from "@/lib/auth";

export const metadata: Metadata = { title: "Editar serviço" };

export default async function EditServicePage(props: PageProps<"/painel/servicos/[id]">) {
  const { id } = await props.params;
  if (!z.uuid().safeParse(id).success) notFound();

  const professional = await requireProfessional();
  const service = await getOwnService(professional.id, id);
  if (!service) notFound();

  return (
    <>
      <PageHeader
        title="Editar serviço"
        actions={
          <form action={deleteService}>
            <input type="hidden" name="id" value={service.id} />
            <Button type="submit" variant="ghost" className="text-red-600">
              Excluir
            </Button>
          </form>
        }
      />
      <ServiceForm service={service} />
    </>
  );
}
