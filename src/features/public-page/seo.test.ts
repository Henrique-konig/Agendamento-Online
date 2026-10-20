import { describe, expect, it } from "vitest";
import type { PublicPage } from "./queries";
import { fullAddress, localBusinessJsonLd, pageDescription } from "./seo";

const professional = {
  id: "p1",
  slug: "ze",
  display_name: "Barbearia do Zé",
  profession: "Barbeiro",
  timezone: "America/Sao_Paulo",
  published: true,
  bio: null,
  phone: null,
  whatsapp: "5551999998888",
  contact_email: null,
  instagram: "barbeariadoze",
  address_line: "Rua A, 10",
  neighborhood: "Centro",
  city: "Porto Alegre",
  state: "RS",
  postal_code: "90000000",
  service_area: null,
  show_address: true,
  avatar_path: null,
  cover_path: null,
  created_at: "",
  updated_at: "",
} satisfies PublicPage["professional"];

const service = {
  id: "s1",
  professional_id: "p1",
  name: "Corte",
  description: null,
  duration_minutes: 30,
  price_cents: 4500,
  price_is_starting: false,
  requires_quote: false,
  active: true,
  position: 0,
  created_at: "",
  updated_at: "",
};

const page = { professional, services: [service], photos: [] } as unknown as PublicPage;

describe("SEO da página pública", () => {
  it("monta endereço completo", () => {
    expect(fullAddress(professional)).toBe("Rua A, 10, Centro, Porto Alegre - RS");
  });

  it("gera descrição a partir dos serviços quando não há bio", () => {
    expect(pageDescription(page)).toBe("Barbeiro em Porto Alegre. Corte. Agende online.");
  });

  it("gera JSON-LD LocalBusiness com endereço e ofertas", () => {
    const json = localBusinessJsonLd(page, "https://x.com/ze");
    expect(json).toMatchObject({
      "@type": "LocalBusiness",
      telephone: "+5551999998888",
      address: { addressLocality: "Porto Alegre", addressRegion: "RS" },
      sameAs: ["https://instagram.com/barbeariadoze"],
    });
    expect(json.hasOfferCatalog?.itemListElement[0]).toMatchObject({ price: "45.00" });
  });

  it("omite endereço quando o profissional prefere ocultar", () => {
    const json = localBusinessJsonLd(
      { ...page, professional: { ...professional, show_address: false } },
      "https://x.com/ze",
    );
    expect(json).not.toHaveProperty("address");
  });
});
