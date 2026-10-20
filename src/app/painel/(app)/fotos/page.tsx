import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { MAX_PHOTOS } from "@/features/photos/constants";
import { GalleryManager } from "@/features/photos/gallery-manager";
import { requireProfessional } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Fotos" };

export default async function PhotosPage() {
  const professional = await requireProfessional();
  const photos = await db.photo.findMany({
    where: { professional_id: professional.id },
    select: { id: true, image_url: true, caption: true },
    orderBy: [{ position: "asc" }, { created_at: "asc" }],
  });

  return (
    <>
      <PageHeader title="Fotos" description="Galeria exibida na sua página pública." />
      <GalleryManager
        professionalId={professional.id}
        initialPhotos={photos}
        maxPhotos={MAX_PHOTOS}
      />
    </>
  );
}
