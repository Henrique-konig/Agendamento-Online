import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { MAX_PHOTOS } from "@/features/photos/constants";
import { GalleryManager } from "@/features/photos/gallery-manager";
import { requireProfessional } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Fotos" };

export default async function PhotosPage() {
  const professional = await requireProfessional();
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("photos")
    .select("id, storage_path, caption")
    .eq("professional_id", professional.id)
    .order("position")
    .order("created_at");

  return (
    <>
      <PageHeader title="Fotos" description="Galeria exibida na sua página pública." />
      <GalleryManager
        professionalId={professional.id}
        initialPhotos={photos ?? []}
        maxPhotos={MAX_PHOTOS}
      />
    </>
  );
}
