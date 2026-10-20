import { formatDuration } from "@/lib/format/money";
import { publicMediaUrl } from "@/lib/storage";
import type { PublicPage } from "./queries";

type Professional = PublicPage["professional"];

export function fullAddress(p: Professional) {
  return [p.address_line, p.neighborhood, p.city && p.state ? `${p.city} - ${p.state}` : p.city]
    .filter(Boolean)
    .join(", ");
}

export function pageDescription(page: PublicPage) {
  const { professional: p, services } = page;
  if (p.bio) return p.bio.slice(0, 155);
  const where = p.city ? ` em ${p.city}` : "";
  const list = services
    .slice(0, 3)
    .map((s) => s.name)
    .join(", ");
  return `${p.profession}${where}. ${list ? `${list}. ` : ""}Agende online.`.slice(0, 155);
}

/** Dados estruturados schema.org para SEO local. */
export function localBusinessJsonLd(page: PublicPage, url: string) {
  const { professional: p, services } = page;
  const image = publicMediaUrl(p.cover_path) ?? publicMediaUrl(p.avatar_path);

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": url,
    url,
    name: p.display_name,
    description: pageDescription(page),
    ...(image ? { image } : {}),
    ...(p.whatsapp || p.phone ? { telephone: `+${p.whatsapp ?? p.phone}` } : {}),
    ...(p.contact_email ? { email: p.contact_email } : {}),
    ...(p.show_address && (p.address_line || p.city)
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: p.address_line ?? undefined,
            addressLocality: p.city ?? undefined,
            addressRegion: p.state ?? undefined,
            postalCode: p.postal_code ?? undefined,
            addressCountry: "BR",
          },
        }
      : {}),
    ...(p.service_area ? { areaServed: p.service_area } : {}),
    ...(p.instagram ? { sameAs: [`https://instagram.com/${p.instagram}`] } : {}),
    ...(services.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Serviços",
            itemListElement: services.map((s) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: s.name,
                description: s.description ?? `Duração: ${formatDuration(s.duration_minutes)}`,
              },
              ...(s.price_cents != null
                ? { price: (s.price_cents / 100).toFixed(2), priceCurrency: "BRL" }
                : {}),
            })),
          },
        }
      : {}),
  };
}
