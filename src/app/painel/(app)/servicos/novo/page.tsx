import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ServiceForm } from "@/features/services/service-form";

export const metadata: Metadata = { title: "Novo serviço" };

export default function NewServicePage() {
  return (
    <>
      <PageHeader title="Novo serviço" />
      <ServiceForm />
    </>
  );
}
