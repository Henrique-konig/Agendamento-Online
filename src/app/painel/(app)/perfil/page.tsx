import type { Metadata } from "next";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileForm } from "@/features/profile/profile-form";
import { ProfileImageField } from "@/features/profile/profile-image-field";
import { requireProfessional } from "@/lib/auth";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const professional = await requireProfessional();

  return (
    <>
      <PageHeader title="Perfil" description="Informações exibidas na sua página pública." />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Imagens" />
          <div className="grid gap-6 sm:grid-cols-2">
            <ProfileImageField
              kind="avatar"
              label="Foto de perfil ou logo"
              professionalId={professional.id}
              currentPath={professional.avatar_path}
            />
            <ProfileImageField
              kind="cover"
              label="Imagem de capa"
              professionalId={professional.id}
              currentPath={professional.cover_path}
            />
          </div>
        </Card>
        <ProfileForm professional={professional} siteHost={new URL(siteUrl()).host} />
      </div>
    </>
  );
}
