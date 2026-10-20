import { Brand } from "@/components/brand";
import { signOut } from "@/features/auth/actions";
import { PainelNav } from "@/features/painel/sidebar";
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
      <aside className="border-b border-ink-200/70 bg-white lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex flex-col gap-4 p-4 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:p-5">
          <div className="lg:mb-2">
            <Brand href="/painel" />
          </div>
          <PainelNav />
          <div className="mt-auto hidden items-center gap-3 border-t border-ink-100 pt-4 lg:flex">
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
      </aside>
      <main className="flex-1 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
