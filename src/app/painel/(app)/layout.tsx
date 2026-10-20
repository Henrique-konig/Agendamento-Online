import { Brand } from "@/components/brand";
import { signOut } from "@/features/auth/actions";
import { PainelNav } from "@/features/painel/sidebar";
import { requireProfessional } from "@/lib/auth";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const professional = await requireProfessional();

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="border-b border-ink-200 bg-white lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex flex-col gap-4 p-4 lg:sticky lg:top-0 lg:h-screen lg:p-6">
          <Brand href="/painel" />
          <PainelNav />
          <div className="mt-auto hidden border-t border-ink-200 pt-4 lg:block">
            <p className="truncate text-sm font-medium text-ink-900">{professional.display_name}</p>
            <p className="truncate text-xs text-ink-500">{professional.profession}</p>
            <form action={signOut} className="mt-3">
              <button type="submit" className="text-sm text-ink-500 hover:text-ink-900">
                Sair
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="flex-1 px-4 py-8 sm:px-8 lg:py-10">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
