import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isValidSlug } from "@/lib/utils/slug";

/** Dados da página pública de um profissional publicado (null se não existir). */
export const getPublicPage = cache(async (slug: string) => {
  const normalized = slug.toLowerCase();
  if (!isValidSlug(normalized)) return null;

  const supabase = createPublicClient();
  const { data: professional } = await supabase
    .from("professionals")
    .select("*")
    .eq("slug", normalized)
    .eq("published", true)
    .maybeSingle();
  if (!professional) return null;

  const [services, photos] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("professional_id", professional.id)
      .eq("active", true)
      .order("position")
      .order("created_at"),
    supabase
      .from("photos")
      .select("id, storage_path, caption")
      .eq("professional_id", professional.id)
      .order("position")
      .order("created_at"),
  ]);

  return { professional, services: services.data ?? [], photos: photos.data ?? [] };
});

export type PublicPage = NonNullable<Awaited<ReturnType<typeof getPublicPage>>>;

export async function listPublishedSlugs() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("professionals")
    .select("slug, updated_at")
    .eq("published", true)
    .limit(5000);
  return data ?? [];
}
