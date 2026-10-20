import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getAvailableDays } from "@/features/booking/availability";
import { BookingForm } from "@/features/booking/booking-form";
import { getPublicPage } from "@/features/public-page/queries";
import { PublicShell } from "@/features/public-page/public-shell";
import { depositAmountCents } from "@/features/payments/amount";
import { getPixSettings, isPixReady } from "@/features/payments/settings";
import { formatBRL, formatDuration, formatServicePrice } from "@/lib/format/money";

export async function generateMetadata(props: PageProps<"/[slug]/agendar">): Promise<Metadata> {
  const { slug } = await props.params;
  const page = await getPublicPage(slug);
  return {
    title: page ? `Agendar com ${page.professional.display_name}` : "Agendar",
    robots: { index: false },
  };
}

export default async function BookingPage(props: PageProps<"/[slug]/agendar">) {
  const [{ slug }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const page = await getPublicPage(slug);
  if (!page || !page.professional.booking_enabled) notFound();

  const { professional } = page;
  const bookable = page.services.filter((s) => !s.requires_quote);
  const serviceId = z.uuid().safeParse(searchParams.servico).data;
  const service =
    bookable.find((s) => s.id === serviceId) ?? (bookable.length === 1 ? bookable[0] : undefined);

  if (!service) {
    return (
      <PublicShell professional={professional} title="Qual serviço você quer agendar?">
        {bookable.length ? (
          <ul className="space-y-3">
            {bookable.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/${professional.slug}/agendar?servico=${s.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl bg-white p-4 ring-1 ring-ink-200 transition hover:ring-brand-500"
                >
                  <span>
                    <span className="block font-medium text-ink-900">{s.name}</span>
                    <span className="text-sm text-ink-500">
                      {formatDuration(s.duration_minutes)} · {formatServicePrice(s)}
                    </span>
                  </span>
                  <span aria-hidden className="text-brand-600">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-600">Nenhum serviço disponível para agendamento online.</p>
        )}
      </PublicShell>
    );
  }

  const [days, pix] = await Promise.all([
    getAvailableDays(professional, service),
    service.requires_prepayment ? getPixSettings(professional.id) : null,
  ]);
  const deposit =
    isPixReady(pix) && service.price_cents
      ? depositAmountCents(service.price_cents, pix.deposit_percent)
      : 0;

  return (
    <PublicShell professional={professional} title="Escolha seu horário">
      <div className="mb-8 flex items-center justify-between gap-4 rounded-xl bg-white p-4 ring-1 ring-ink-200">
        <div>
          <p className="font-medium text-ink-900">{service.name}</p>
          <p className="text-sm text-ink-500">
            {formatDuration(service.duration_minutes)} · {formatServicePrice(service)}
          </p>
        </div>
        {bookable.length > 1 ? (
          <Link
            href={`/${professional.slug}/agendar`}
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            Trocar
          </Link>
        ) : null}
      </div>
      <BookingForm
        slug={professional.slug}
        serviceId={service.id}
        timeZone={professional.timezone}
        days={days.map((d) => ({ date: d.date, slots: d.slots.map((s) => s.toISOString()) }))}
        prepayment={
          deposit && pix
            ? {
                amountLabel: formatBRL(deposit),
                holdMinutes: pix.hold_minutes,
                requireEmail: pix.mode === "mercadopago",
              }
            : undefined
        }
      />
    </PublicShell>
  );
}
