import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicPage } from "@/features/public-page/queries";
import { PublicShell } from "@/features/public-page/public-shell";
import { QuoteForm } from "@/features/quotes/quote-form";

export async function generateMetadata(props: PageProps<"/[slug]/orcamento">): Promise<Metadata> {
  const { slug } = await props.params;
  const page = await getPublicPage(slug);
  return {
    title: page ? `Pedir orçamento a ${page.professional.display_name}` : "Pedir orçamento",
    robots: { index: false },
  };
}

export default async function QuotePage(props: PageProps<"/[slug]/orcamento">) {
  const [{ slug }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const page = await getPublicPage(slug);
  if (!page) notFound();

  const services = page.services.map((s) => ({ id: s.id, name: s.name }));
  const requested = typeof searchParams.servico === "string" ? searchParams.servico : undefined;

  return (
    <PublicShell professional={page.professional} title="Pedir orçamento">
      <QuoteForm
        slug={page.professional.slug}
        services={services}
        defaultServiceId={services.some((s) => s.id === requested) ? requested : undefined}
      />
    </PublicShell>
  );
}
