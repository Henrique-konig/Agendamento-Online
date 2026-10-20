import { Brand } from "@/components/brand";
import { signOut } from "@/features/auth/actions";
import { MobileNav } from "@/features/painel/mobile-nav";
import { PainelNav } from "@/features/painel/sidebar";
import { InstallApp } from "@/features/pwa/install-app";
import { requireProfessional } from "@/lib/auth";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const professional = await requireProfessional();
  const initials = professional.display_name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* Celular: topo enxuto; o menu fica na barra de baixo (MobileNav). */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-200/70 bg-white/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
        <div className="flex h-14 items-center">
          <Brand href="/painel" />
        </div>
        <span className="grid size-8 place-items-center rounded-full bg-brand-700 font-display text-[11px] font-semibold text-white">
          {initials}
        </span>
      </header>

      <aside className="hidden border-r border-ink-200/70 bg-white lg:block lg:w-64 lg:shrink-0">
        <div className="sticky top-0 flex h-screen flex-col gap-4 overflow-y-auto p-5">
          <div className="mb-2">
            <Brand href="/painel" />
          </div>
          <PainelNav />
          <div className="mt-auto flex flex-col gap-4">
            <InstallApp />
            <div className="flex items-center gap-3 border-t border-ink-100 pt-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-700 font-display text-xs font-semibold text-white">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">
                  {professional.display_name}
                </p>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="text-xs text-ink-500 transition-colors hover:text-ink-900"
                  >
                    Sair
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>

      <MobileNav displayName={professional.display_name} initials={initials} />
    </div>
  );
}
