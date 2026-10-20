import { Brand } from "@/components/brand";
import { LinkButton } from "@/components/ui/button";

const features = [
  {
    title: "Página profissional",
    text: "Serviços, preços, fotos e localização em um endereço só seu, pronto para compartilhar.",
  },
  {
    title: "Agendamento online",
    text: "Seus clientes veem apenas os horários livres e marcam sozinhos, 24 horas por dia.",
  },
  {
    title: "Orçamentos",
    text: "Para serviços que exigem avaliação, receba pedidos com descrição e fotos do problema.",
  },
  {
    title: "Lembretes automáticos",
    text: "E-mail ou WhatsApp no dia anterior para reduzir faltas sem você levantar um dedo.",
  },
  {
    title: "Google Agenda",
    text: "Sincronize compromissos e evite conflitos com a agenda que você já usa.",
  },
  {
    title: "Pix antecipado",
    text: "Se quiser, cobre um sinal no momento do agendamento e garanta o compromisso.",
  },
];

const audiences = ["Barbeiros", "Nutricionistas", "Eletricistas", "Personal trainers", "Manicures"];

export default function HomePage() {
  return (
    <>
      <header className="border-ink-200 border-b bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <nav className="flex items-center gap-2">
            <LinkButton href="/entrar" variant="ghost">
              Entrar
            </LinkButton>
            <LinkButton href="/cadastro">Criar minha página</LinkButton>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
            <p className="text-brand-700 text-sm font-semibold">
              {audiences.join(" · ")} e outros autônomos
            </p>
            <h1 className="text-ink-900 mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Troque o WhatsApp e o caderno por uma agenda que trabalha sozinha.
            </h1>
            <p className="text-ink-600 mt-6 max-w-2xl text-lg">
              Monte sua página em minutos, mostre seus serviços e deixe os clientes agendarem nos
              horários que você definir.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <LinkButton href="/cadastro" size="lg">
                Começar agora
              </LinkButton>
              <LinkButton href="#recursos" size="lg" variant="secondary">
                Ver recursos
              </LinkButton>
            </div>
          </div>
        </section>

        <section id="recursos" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Tudo o que um autônomo precisa</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="ring-ink-200/70 rounded-2xl bg-white p-6 ring-1">
                <h3 className="text-ink-900 font-semibold">{f.title}</h3>
                <p className="text-ink-600 mt-2 text-sm">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-ink-200 border-t bg-white">
        <div className="text-ink-500 mx-auto max-w-6xl px-4 py-8 text-sm sm:px-6">
          © {new Date().getFullYear()} Agenda Autônomo
        </div>
      </footer>
    </>
  );
}
