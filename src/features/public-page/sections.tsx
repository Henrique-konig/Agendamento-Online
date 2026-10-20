import Image from "next/image";
import type { ReactNode } from "react";
import { formatPhoneBR, whatsappLink } from "@/lib/format/contact";
import { formatDuration, formatServicePrice } from "@/lib/format/money";
import { publicMediaUrl } from "@/lib/storage";
import type { PublicPage } from "./queries";
import { fullAddress } from "./seo";

type Professional = PublicPage["professional"];
type Service = PublicPage["services"][number];

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6">
      <h2 id={`${id}-title`} className="mb-4 text-lg font-semibold text-ink-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Hero({
  professional: p,
  actions,
}: {
  professional: Professional;
  actions: ReactNode;
}) {
  const cover = publicMediaUrl(p.cover_path);
  const avatar = publicMediaUrl(p.avatar_path);
  const location = p.city ? [p.neighborhood, p.city].filter(Boolean).join(", ") : p.service_area;

  return (
    <header className="bg-white">
      <div className="relative h-40 bg-gradient-to-br from-brand-600 to-brand-900 sm:h-56">
        {cover ? (
          <Image src={cover} alt="" fill priority sizes="100vw" className="object-cover" />
        ) : null}
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-8 sm:px-6">
        <div className="-mt-12 flex flex-col gap-4 sm:-mt-14">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-ink-100 ring-4 ring-white sm:size-28">
            {avatar ? (
              <Image
                src={avatar}
                alt={p.display_name}
                fill
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <span className="grid size-full place-items-center text-3xl font-semibold text-ink-400">
                {p.display_name.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
              {p.display_name}
            </h1>
            <p className="text-ink-600">
              {p.profession}
              {location ? <span className="text-ink-400"> · {location}</span> : null}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">{actions}</div>
      </div>
    </header>
  );
}

export function ServiceList({
  services,
  renderAction,
}: {
  services: Service[];
  renderAction?: (service: Service) => ReactNode;
}) {
  return (
    <ul className="divide-y divide-ink-100 overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200/70">
      {services.map((s) => (
        <li key={s.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-ink-900">{s.name}</h3>
            {s.description ? <p className="mt-1 text-sm text-ink-600">{s.description}</p> : null}
            <p className="mt-1 text-sm text-ink-500">
              {formatDuration(s.duration_minutes)} ·{" "}
              <span className="font-medium text-ink-800">{formatServicePrice(s)}</span>
            </p>
          </div>
          {renderAction ? <div className="shrink-0">{renderAction(s)}</div> : null}
        </li>
      ))}
    </ul>
  );
}

export function Gallery({ photos }: { photos: PublicPage["photos"] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo) => (
        <li key={photo.id}>
          <figure className="overflow-hidden rounded-xl bg-ink-100">
            <div className="relative aspect-square">
              <Image
                src={publicMediaUrl(photo.storage_path) ?? ""}
                alt={photo.caption ?? ""}
                fill
                sizes="(min-width: 768px) 250px, 50vw"
                className="object-cover"
              />
            </div>
            {photo.caption ? (
              <figcaption className="bg-white px-3 py-2 text-xs text-ink-600">
                {photo.caption}
              </figcaption>
            ) : null}
          </figure>
        </li>
      ))}
    </ul>
  );
}

export function Location({ professional: p }: { professional: Professional }) {
  const address = fullAddress(p);
  const query = encodeURIComponent([address, p.state, "Brasil"].filter(Boolean).join(", "));

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200/70">
      <iframe
        title={`Mapa: ${address}`}
        src={`https://www.google.com/maps?q=${query}&output=embed`}
        className="h-64 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
        <address className="text-sm text-ink-700 not-italic">
          {address}
          {p.postal_code ? ` · CEP ${p.postal_code.replace(/(\d{5})(\d{3})/, "$1-$2")}` : ""}
        </address>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${query}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          Como chegar →
        </a>
      </div>
    </div>
  );
}

export function Contact({ professional: p }: { professional: Professional }) {
  const items = [
    p.whatsapp && {
      label: "WhatsApp",
      value: formatPhoneBR(p.whatsapp),
      href: whatsappLink(p.whatsapp),
    },
    p.phone && { label: "Telefone", value: p.phone, href: `tel:${p.phone.replace(/\D/g, "")}` },
    p.contact_email && {
      label: "E-mail",
      value: p.contact_email,
      href: `mailto:${p.contact_email}`,
    },
    p.instagram && {
      label: "Instagram",
      value: `@${p.instagram}`,
      href: `https://instagram.com/${p.instagram}`,
    },
  ].filter(Boolean) as Array<{ label: string; value: string; href: string }>;

  if (!items.length) return null;

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl bg-white p-4 ring-1 ring-ink-200/70">
          <dt className="text-xs font-medium tracking-wide text-ink-500 uppercase">{item.label}</dt>
          <dd className="mt-1">
            <a
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="font-medium break-all text-ink-900 hover:text-brand-700"
            >
              {item.value}
            </a>
          </dd>
        </div>
      ))}
    </dl>
  );
}
