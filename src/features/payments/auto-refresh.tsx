"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Recarrega os dados da página periodicamente enquanto aguarda o pagamento. */
export function AutoRefresh({ intervalMs = 5000, until }: { intervalMs?: number; until: string }) {
  const router = useRouter();
  useEffect(() => {
    const deadline = new Date(until).getTime();
    const id = setInterval(() => {
      if (Date.now() > deadline + 60_000) clearInterval(id);
      else router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs, until]);
  return null;
}
