import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { isValidSlug } from "@/lib/utils/slug";

/** Dados da página pública de um profissional publicado (null se não existir). */
export const getPublicPage = cache(async (slug: string) => {
  const normalized = slug.toLowerCase();
  if (!isValidSlug(normalized)) return null;

  const professional = await db.professional.findFirst({
    where: { slug: normalized, published: true },
  });
  if (!professional) return null;

  const [services, photos] = await Promise.all([
    db.service.findMany({
      where: { professional_id: professional.id, active: true },
      orderBy: [{ position: "asc" }, { created_at: "asc" }],
    }),
    db.photo.findMany({
      where: { professional_id: professional.id },
      orderBy: [{ position: "asc" }, { created_at: "asc" }],
      select: { id: true, image_url: true, caption: true },
    }),
  ]);

  return { professional, services, photos };
});

export type PublicPage = NonNullable<Awaited<ReturnType<typeof getPublicPage>>>;

export async function listPublishedSlugs() {
  return db.professional.findMany({
    where: { published: true },
    select: { slug: true, updated_at: true },
    take: 5000,
  });
}
