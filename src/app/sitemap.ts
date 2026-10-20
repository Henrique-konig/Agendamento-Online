import type { MetadataRoute } from "next";
import { listPublishedSlugs } from "@/features/public-page/queries";
import { siteUrl } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const home = { url: siteUrl("/"), changeFrequency: "weekly" as const, priority: 1 };
  try {
    const professionals = await listPublishedSlugs();
    return [
      home,
      ...professionals.map((p) => ({
        url: siteUrl(`/${p.slug}`),
        lastModified: p.updated_at,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // Sem banco acessível (ex.: build sem DATABASE_URL) o sitemap traz só a home.
    return [home];
  }
}
