"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { signOut } from "@/features/auth/actions";
import { InstallApp } from "@/features/pwa/install-app";
import { cn } from "@/lib/utils/cn";
import { painelNav, type NavItem } from "./nav";

const [primary, ...secondary] = painelNav;

function isActive(pathname: string, href: string) {
  return href === "/painel" ? pathname === href : pathname.startsWith(href);
}

/**
 * Navegação do painel no celular: barra fixa embaixo com o dia a dia
 * (Início, Agenda, Clientes, Orçamentos) e "Mais", que abre uma folha com
 * o resto do menu, o "Instalar app" e o Sair.
 */
export function MobileNav({ displayName, initials }: { displayName: string; initials: string }) {
  const pathname = usePathname();
  const sheet = useRef<HTMLDialogElement>(null);
  const moreActive = secondary.some((group) =>
    group.items.some((item) => isActive(pathname, item.href)),
  );

  // Fecha a folha ao navegar.
  useEffect(() => {
    sheet.current?.close();
  }, [pathname]);

  return (
    <>
      <nav
        aria-label="Painel"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {primary.items.map((item) => (
            <li key={item.href}>
              <TabLink item={item} active={isActive(pathname, item.href)} />
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => sheet.current?.showModal()}
              className={cn(
                "flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                moreActive ? "text-brand-700" : "text-ink-500",
              )}
            >
              <Icon name="more" size={22} />
              Mais
            </button>
          </li>
        </ul>
      </nav>

      <dialog
        ref={sheet}
        aria-label="Menu"
        onClick={(event) => {
          // Toque no fundo escurecido fecha a folha.
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="m-0 mt-auto max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-white p-0 text-ink-900 shadow-lift backdrop:bg-ink-900/40 backdrop:backdrop-blur-[2px] open:animate-rise lg:hidden"
      >
        <div className="px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-200" aria-hidden />
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-700 font-display text-sm font-semibold text-white">
              {initials}
            </span>
            <p className="min-w-0 flex-1 truncate font-medium">{displayName}</p>
            <button
              type="button"
              onClick={() => sheet.current?.close()}
              aria-label="Fechar menu"
              className="grid size-10 place-items-center rounded-full text-ink-500 hover:bg-ink-100"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-5">
            {secondary.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-1 font-mono text-[10px] tracking-widest text-ink-400 uppercase">
                  {group.label}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-medium transition-colors",
                          active
                            ? "border-brand-200 bg-brand-50 text-brand-800"
                            : "border-ink-100 text-ink-700 active:bg-ink-50",
                        )}
                      >
                        <span className={active ? "text-brand-600" : "text-ink-400"}>
                          <Icon name={item.icon} size={22} />
                        </span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <InstallApp />

            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-ink-100 py-3 text-sm font-medium text-ink-600 active:bg-ink-50"
              >
                <Icon name="logout" />
                Sair
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
        active ? "text-brand-700" : "text-ink-500",
      )}
    >
      {active ? (
        <span className="absolute top-0 h-0.5 w-8 rounded-full bg-amber-400" aria-hidden />
      ) : null}
      <Icon name={item.icon} size={22} />
      {item.label}
    </Link>
  );
}
