import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ManualAppointmentForm } from "@/features/appointments/manual-form";
import { listOwnServices } from "@/features/services/queries";
import { requireProfessional } from "@/lib/auth";
import { instantToLocalDate, isLocalDate } from "@/lib/scheduling/time";

export const metadata: Metadata = { title: "Novo agendamento" };

export default async function NewAppointmentPage(props: PageProps<"/painel/agenda/novo">) {
  const professional = await requireProfessional();
  const searchParams = await props.searchParams;
  const services = await listOwnServices(professional.id);
  const day =
    typeof searchParams.dia === "string" && isLocalDate(searchParams.dia)
      ? searchParams.dia
      : instantToLocalDate(new Date(), professional.timezone);

  return (
    <>
      <PageHeader
        title="Novo agendamento"
        description="Para clientes que marcaram por WhatsApp, telefone ou pessoalmente."
      />
      <ManualAppointmentForm
        services={services.map((s) => ({ id: s.id, name: s.name }))}
        defaultDate={day}
      />
    </>
  );
}
