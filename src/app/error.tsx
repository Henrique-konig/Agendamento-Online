"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Algo deu errado</h1>
      <p className="text-ink-500 mt-2">Tente novamente em instantes.</p>
      <Button onClick={reset} className="mt-8">
        Tentar novamente
      </Button>
    </main>
  );
}
