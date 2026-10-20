import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Professional } from "@/types/models";

/** Cabeçalho compacto para as páginas internas do profissional (agendar, orçamento...). */
export function PublicShell({
  professional,
  title,
  children,
}: {
  professional: Pick<Professional, "slug" | "display_name" | "profession" | "avatar_url">;
  title: string;
  children: ReactNode;
}) {
  const avatar = professional.avatar_url;
  return (
    <>
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link href={`/${professional.slug}`} className="flex min-w-0 items-center gap-3">
            <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-ink-100">
              {avatar ? (
                <Image src={avatar} alt="" fill sizes="40px" className="object-cover" />
              ) : null}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium text-ink-900">
                {professional.display_name}
              </span>
              <span className="block truncate text-xs text-ink-500">{professional.profession}</span>
            </span>
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">{title}</h1>
        {children}
      </main>
    </>
  );
}
