import type { Metadata } from "next";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireProfessional } from "@/lib/auth";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = { title: "Painel" };

export default async function PainelHomePage() {
  const professional = await requireProfessional();
  const publicUrl = siteUrl(`/${professional.slug}`);

  return (
    <>
      <PageHeader
        title={`Olá, ${professional.display_name}`}
        description="Acompanhe sua agenda e mantenha sua página atualizada."
      />
      <Card>
        <CardHeader
          title="Sua página"
          description={professional.published ? "Publicada" : "Ainda não publicada"}
        />
        <p className="text-ink-700 font-mono text-sm break-all">{publicUrl}</p>
      </Card>
    </>
  );
}
