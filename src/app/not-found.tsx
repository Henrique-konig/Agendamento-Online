import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Página não encontrada</h1>
      <p className="mt-2 text-ink-500">
        O endereço pode ter mudado ou a página não está publicada.
      </p>
      <LinkButton href="/" className="mt-8">
        Voltar ao início
      </LinkButton>
    </main>
  );
}
