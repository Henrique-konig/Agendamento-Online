import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { publicMediaUrl } from "@/lib/storage";
import type { Tables } from "@/types/database";

/** Cabeçalho compacto para as páginas internas do profissional (agendar, orçamento...). */
export function PublicShell({
  professional,
  title,
  children,
}: {
  professional: Pick<
    Tables<"professionals">,
    "slug" | "display_name" | "profession" | "avatar_path"
  >;
  title: string;
  children: ReactNode;
}) {
  const avatar = publicMediaUrl(professional.avatar_path);
  return (
    <>
      <header className="border-ink-200 border-b bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link href={`/${professional.slug}`} className="flex min-w-0 items-center gap-3">
            <span className="bg-ink-100 relative size-10 shrink-0 overflow-hidden rounded-full">
              {avatar ? (
                <Image src={avatar} alt="" fill sizes="40px" className="object-cover" />
              ) : null}
            </span>
            <span className="min-w-0">
              <span className="text-ink-900 block truncate font-medium">
                {professional.display_name}
              </span>
              <span className="text-ink-500 block truncate text-xs">{professional.profession}</span>
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
