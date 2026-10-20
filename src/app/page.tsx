import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import { LinkButton } from "@/components/ui/button";
import { DemoBooking } from "@/features/landing/demo-booking";
import { cn } from "@/lib/utils/cn";

const audiences = ["Barbeiros", "Nutricionistas", "Eletricistas", "Personal trainers", "Manicures"];

type Feature = { title: string; text: string; className?: string; icon: ReactNode; tone?: "dark" };

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const features: Feature[] = [
  {
    title: "Só horários livres",
    text: "O cliente vê apenas o que está vago, no seu expediente, com folga entre atendimentos e antecedência mínima. Nada de ir e voltar no WhatsApp para combinar.",
    className: "lg:col-span-2",
    tone: "dark",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M8 2v4M16 2v4M3 10h18M8 15l2.5 2.5L16 13" />
      </svg>
    ),
  },
  {
    title: "Página própria",
    text: "Serviços, preços, fotos e mapa no endereço que você divulga.",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    title: "Orçamento antes do serviço",
    text: "Para o que exige avaliação, o cliente descreve o pedido e você responde no WhatsApp.",
    icon: (
      <svg {...iconProps}>
        <path d="M7 3h8l4 4v14H7z" />
        <path d="M15 3v4h4M10 12h6M10 16h6" />
      </svg>
    ),
  },
  {
    title: "Lembrete no dia anterior",
    text: "E-mail ou WhatsApp automático. Menos falta, sem você lembrar de avisar.",
    icon: (
      <svg {...iconProps}>
        <path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 0 0 4 0" />
      </svg>
    ),
  },
  {
    title: "Google Agenda",
    text: "O que está ocupado na sua agenda pessoal some dos horários oferecidos. Cada agendamento vira evento.",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    title: "Sinal por Pix",
    text: "Se quiser, cobre um sinal ao agendar. O horário só confirma depois do pagamento.",
    className: "lg:col-span-2",
    icon: (
      <svg {...iconProps}>
        <path d="M12 3l4 4-4 4-4-4zM12 13l4 4-4 4-4-4zM3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4" />
      </svg>
    ),
  },
];

const steps = [
  {
    title: "Monte sua página",
    text: "Cadastre serviços, preços e fotos. Leva uns dez minutos.",
  },
  {
    title: "Defina seus horários",
    text: "Dias, faixas de atendimento, pausas e folgas.",
  },
  {
    title: "Compartilhe o link",
    text: "No Instagram, no WhatsApp e no Google Meu Negócio. O cliente marca sozinho.",
  },
];

export default function HomePage() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-ink-200/60 bg-ink-50/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <nav className="flex items-center gap-1 sm:gap-2">
            <a
              href="#recursos"
              className="hidden rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:text-ink-900 sm:block"
            >
              Recursos
            </a>
            <LinkButton href="/entrar" variant="ghost">
              Entrar
            </LinkButton>
            <LinkButton href="/cadastro">Criar minha página</LinkButton>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="bg-ruler pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 [mask-image:linear-gradient(to_left,black,transparent)] opacity-40 lg:block"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
            <div>
              <p className="mb-5 inline-flex animate-rise items-center gap-2 rounded-full bg-amber-100 px-3 py-1 font-mono text-xs text-amber-800">
                <span className="size-1.5 rounded-full bg-amber-500" />
                para quem trabalha por conta própria
              </p>
              <h1 className="animate-rise text-5xl leading-[1.02] font-semibold delay-1 sm:text-6xl lg:text-7xl">
                Seu cliente marca.
                <br />
                <span className="text-brand-600">Você só atende.</span>
              </h1>
              <p className="mt-6 max-w-xl animate-rise text-lg leading-relaxed text-ink-600 delay-2">
                Uma página com seus serviços, preços e horários livres. O cliente escolhe o dia e a
                hora, e o horário cai direto na sua agenda. Chega de caderno e de conversa para
                combinar.
              </p>
              <div className="mt-9 flex animate-rise flex-wrap gap-3 delay-3">
                <LinkButton href="/cadastro" size="lg">
                  Criar minha página
                </LinkButton>
                <LinkButton href="#como-funciona" size="lg" variant="secondary">
                  Ver como funciona
                </LinkButton>
              </div>
              <ul className="mt-10 flex animate-fade flex-wrap gap-x-5 gap-y-2 text-sm text-ink-500 delay-4">
                {audiences.map((a) => (
                  <li key={a} className="flex items-center gap-2">
                    <span className="size-1 rounded-full bg-ink-300" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex animate-rise justify-center delay-2 lg:justify-end">
              <DemoBooking />
            </div>
          </div>
        </section>

        <section id="recursos" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <h2 className="max-w-2xl text-3xl font-semibold sm:text-4xl">
            Tudo o que um autônomo usa no dia a dia, num lugar só
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <article
                key={f.title}
                className={cn(
                  "group rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1",
                  f.tone === "dark"
                    ? "bg-brand-800 text-white shadow-lift"
                    : "bg-white shadow-soft ring-1 ring-ink-200/60 hover:shadow-lift",
                  f.className,
                )}
              >
                <span
                  className={cn(
                    "mb-5 grid size-11 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
                    f.tone === "dark" ? "bg-amber-400 text-ink-900" : "bg-brand-50 text-brand-700",
                  )}
                >
                  {f.icon}
                </span>
                <h3 className="text-xl font-semibold">{f.title}</h3>
                <p
                  className={cn(
                    "mt-2 leading-relaxed",
                    f.tone === "dark" ? "text-brand-100" : "text-ink-600",
                  )}
                >
                  {f.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-20 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="max-w-xl text-3xl font-semibold sm:text-4xl">Pronto em três passos</h2>
            <ol className="relative mt-12 grid gap-10 md:grid-cols-3">
              <div
                aria-hidden
                className="absolute top-[22px] right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-transparent via-ink-300 to-transparent md:block"
              />
              {steps.map((step, i) => (
                <li key={step.title} className="relative text-center md:px-4">
                  <span className="relative mx-auto mb-5 grid size-11 place-items-center rounded-full bg-amber-400 font-mono text-sm font-semibold text-ink-900 shadow-soft ring-8 ring-white">
                    {i + 1}
                  </span>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-ink-600">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-brand-800 px-8 py-16 text-center text-white sm:px-16">
            <div
              aria-hidden
              className="bg-ruler absolute inset-0 opacity-[0.07] [filter:invert(1)]"
            />
            <div
              aria-hidden
              className="absolute -top-24 -right-24 size-72 rounded-full bg-amber-400/25 blur-3xl"
            />
            <h2 className="relative mx-auto max-w-2xl text-3xl font-semibold sm:text-4xl">
              Deixe a agenda trabalhar por você
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-brand-100">
              Crie sua página agora e receba o primeiro agendamento ainda hoje.
            </p>
            <div className="relative mt-8">
              <LinkButton href="/cadastro" size="lg" variant="accent">
                Criar minha página
              </LinkButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink-200/70 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 text-sm text-ink-500 sm:flex-row sm:items-center sm:px-6">
          <Brand />
          <p>© {new Date().getFullYear()} Agenda Autônomo</p>
        </div>
      </footer>
    </>
  );
}
