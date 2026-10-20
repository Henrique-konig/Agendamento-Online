import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getAvailableDays } from "@/features/booking/availability";
import { BookingForm } from "@/features/booking/booking-form";
import { getPublicPage } from "@/features/public-page/queries";
import { PublicShell } from "@/features/public-page/public-shell";
import { formatDuration, formatServicePrice } from "@/lib/format/money";
import { createAdminClient } from "@/lib/supabase/admin";

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
                  className="ring-ink-200 hover:ring-brand-500 flex items-center justify-between gap-4 rounded-xl bg-white p-4 ring-1 transition"
                >
                  <span>
                    <span className="text-ink-900 block font-medium">{s.name}</span>
                    <span className="text-ink-500 text-sm">
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

  const days = await getAvailableDays(createAdminClient(), professional, service);

  return (
    <PublicShell professional={professional} title="Escolha seu horário">
      <div className="ring-ink-200 mb-8 flex items-center justify-between gap-4 rounded-xl bg-white p-4 ring-1">
        <div>
          <p className="text-ink-900 font-medium">{service.name}</p>
          <p className="text-ink-500 text-sm">
            {formatDuration(service.duration_minutes)} · {formatServicePrice(service)}
          </p>
        </div>
        {bookable.length > 1 ? (
          <Link
            href={`/${professional.slug}/agendar`}
            className="text-brand-700 text-sm font-medium hover:underline"
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
      />
    </PublicShell>
  );
}
