import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Brand } from "@/components/brand";
import { buttonClasses } from "@/components/ui/button";
import { getPublicPage } from "@/features/public-page/queries";
import {
  Contact,
  Gallery,
  Hero,
  Location,
  Section,
  ServiceList,
} from "@/features/public-page/sections";
import { localBusinessJsonLd, pageDescription } from "@/features/public-page/seo";
import { whatsappLink } from "@/lib/format/contact";
import { siteUrl } from "@/lib/env";

// A página é regenerada em segundo plano e também revalidada sob demanda
// sempre que o profissional salva alterações no painel.
export const revalidate = 300;

// Nenhuma página é gerada no build; cada uma é gerada no primeiro acesso e
// depois servida do cache (ISR).
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const page = await getPublicPage(slug);
  if (!page) return { title: "Página não encontrada" };

  const { professional: p } = page;
  const title = p.city ? `${p.display_name} — ${p.profession} em ${p.city}` : p.display_name;
  const image = p.cover_url ?? p.avatar_url;

  return {
    title: { absolute: title },
    description: pageDescription(page),
    alternates: { canonical: `/${p.slug}` },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      title,
      description: pageDescription(page),
      url: `/${p.slug}`,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function PublicProfilePage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  const page = await getPublicPage(slug);
  if (!page) notFound();

  const { professional: p, services, photos } = page;
  const hasAddress = p.show_address && Boolean(p.address_line || p.city);
  const jsonLd = localBusinessJsonLd(page, siteUrl(`/${p.slug}`));

  const canBook = p.booking_enabled && services.some((s) => !s.requires_quote);
  const hasQuote = services.some((s) => s.requires_quote);

  const bookingCta = canBook ? (
    <Link href={`/${p.slug}/agendar`} className={buttonClasses("primary", "lg")}>
      Agendar horário
    </Link>
  ) : hasQuote ? (
    <Link href={`/${p.slug}/orcamento`} className={buttonClasses("primary", "lg")}>
      Pedir orçamento
    </Link>
  ) : null;

  const whatsappCta = p.whatsapp ? (
    <a
      href={whatsappLink(
        p.whatsapp,
        `Olá, ${p.display_name}! Vi sua página e gostaria de agendar.`,
      )}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClasses("secondary", "lg")}
    >
      Falar no WhatsApp
    </a>
  ) : null;

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify escapa aspas; "<" é escapado para evitar fechamento de tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Hero
        professional={p}
        actions={
          <>
            {bookingCta}
            {whatsappCta}
          </>
        }
      />

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-12 px-4 py-10 sm:px-6">
        {services.length ? (
          <Section id="servicos" title="Serviços">
            <ServiceList
              services={services}
              renderAction={(s) =>
                s.requires_quote ? (
                  <Link
                    href={`/${p.slug}/orcamento?servico=${s.id}`}
                    className={buttonClasses("secondary", "sm")}
                  >
                    Pedir orçamento
                  </Link>
                ) : p.booking_enabled ? (
                  <Link
                    href={`/${p.slug}/agendar?servico=${s.id}`}
                    className={buttonClasses("primary", "sm")}
                  >
                    Agendar
                  </Link>
                ) : null
              }
            />
          </Section>
        ) : null}

        {photos.length ? (
          <Section id="fotos" title="Fotos">
            <Gallery photos={photos} />
          </Section>
        ) : null}

        {p.bio ? (
          <Section id="sobre" title="Sobre">
            <p className="leading-relaxed whitespace-pre-line text-ink-700">{p.bio}</p>
          </Section>
        ) : null}

        {hasAddress || p.service_area ? (
          <Section id="localizacao" title="Localização">
            {p.service_area ? (
              <p className="mb-4 text-sm text-ink-700">
                <span className="font-medium">Área de atendimento:</span> {p.service_area}
              </p>
            ) : null}
            {hasAddress ? <Location professional={p} /> : null}
          </Section>
        ) : null}

        <Section id="contato" title="Contato">
          <Contact professional={p} />
        </Section>
      </main>

      <footer className="border-t border-ink-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6 text-xs text-ink-500 sm:px-6">
          <span>
            © {new Date().getFullYear()} {p.display_name}
          </span>
          <span className="flex items-center gap-1">
            Feito com <Brand />
          </span>
        </div>
      </footer>
    </>
  );
}
