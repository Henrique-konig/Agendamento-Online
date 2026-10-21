"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils/cn";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** iPhone/iPad no navegador (fora do app instalado): precisa da instrução manual. */
function isIosBrowser() {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return !standalone && /iphone|ipad|ipod/i.test(navigator.userAgent);
}

const subscribeNothing = () => () => {};

/**
 * "Instalar app": no Android/Chrome usa o convite nativo do navegador; no
 * iPhone (que não tem convite) explica o caminho pelo botão Compartilhar.
 * Some quando o app já está instalado.
 */
export function InstallApp({ className }: { className?: string }) {
  const iosBrowser = useSyncExternalStore(subscribeNothing, isIosBrowser, () => false);
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const mode = installed ? "hidden" : promptEvent ? "prompt" : iosBrowser ? "ios" : "hidden";

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setPromptEvent(null);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "hidden") return null;

  async function install() {
    if (mode === "ios") {
      setShowIosHelp((open) => !open);
      return;
    }
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    setPromptEvent(null);
    if (outcome === "accepted") setInstalled(true);
  }

  return (
    <div className={cn("rounded-2xl border border-brand-100 bg-brand-50 p-3", className)}>
      <button
        type="button"
        onClick={install}
        className="flex w-full items-center gap-3 text-left"
        aria-expanded={mode === "ios" ? showIosHelp : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="size-9 rounded-[10px] shadow-soft" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-brand-800">Instalar o app</span>
          <span className="block text-xs text-ink-500">Abra a agenda direto da tela inicial</span>
        </span>
      </button>
      {mode === "ios" && showIosHelp ? (
        <p className="mt-3 border-t border-brand-100 pt-3 text-xs leading-relaxed text-ink-600">
          No Safari, toque em <strong>Compartilhar</strong> (o quadrado com a seta para cima) e
          depois em <strong>Adicionar à Tela de Início</strong>.
        </p>
      ) : null}
    </div>
  );
}
