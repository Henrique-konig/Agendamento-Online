import { describe, expect, it } from "vitest";
import { makeProfessional, makeService } from "@/test/fixtures";
import type { PublicPage } from "./queries";
import { fullAddress, localBusinessJsonLd, pageDescription } from "./seo";

const professional = makeProfessional();
const page: PublicPage = { professional, services: [makeService()], photos: [] };

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
