import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid flex-1 lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-brand-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="bg-ruler absolute inset-0 opacity-[0.07] [filter:invert(1)]" />
        <div
          aria-hidden
          className="absolute -right-24 -bottom-24 size-96 rounded-full bg-amber-400/25 blur-3xl"
        />
        <div className="relative">
          <Brand light />
        </div>
        <div className="relative max-w-md">
          <p className="font-display text-4xl leading-tight font-semibold">
            Seu cliente marca.
            <br />
            <span className="text-amber-300">Você só atende.</span>
          </p>
          <p className="mt-4 text-brand-100">
            Página com serviços e preços, horários livres em tempo real e lembretes automáticos.
          </p>
        </div>
        <ul className="relative flex gap-2 font-mono text-sm">
          {["09:00", "09:30", "10:30", "14:00"].map((t, i) => (
            <li
              key={t}
              className={
                i === 1
                  ? "rounded-lg bg-amber-400 px-3 py-1.5 font-semibold text-ink-900"
                  : "rounded-lg bg-white/10 px-3 py-1.5 text-brand-100"
              }
            >
              {t}
            </li>
          ))}
        </ul>
      </aside>
      <main className="flex flex-col items-center justify-center px-4 py-14">
        <div className="mb-8 lg:hidden">
          <Brand />
        </div>
        <div className="w-full max-w-sm animate-rise rounded-3xl bg-white p-8 shadow-lift ring-1 ring-ink-200/60">
          {children}
        </div>
      </main>
    </div>
  );
}
