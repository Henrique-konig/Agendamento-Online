"use client";

import { useEffect, useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { removePushSubscription, savePushSubscription, sendTestPush } from "./actions";

type Support = "checking" | "unsupported" | "ios-needs-install" | "ready";

function urlBase64ToUint8Array(base64: string) {
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function detectSupport(): Support {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  // No iPhone o push só funciona no app instalado na tela inicial.
  if (ios && !standalone) return "ios-needs-install";
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported";
  }
  return "ready";
}

export function PushToggle({ publicKey }: { publicKey: string }) {
  const [support, setSupport] = useState<Support>("checking");
  const [active, setActive] = useState(false);
  const [denied, setDenied] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const found = detectSupport();
      if (cancelled) return;
      setSupport(found);
      if (found !== "ready") return;
      setDenied(Notification.permission === "denied");
      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (!cancelled) setActive(Boolean(existing));
      } catch {
        // Sem service worker (ex.: ambiente de desenvolvimento): o botão continua, mas falha com aviso.
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  function enable() {
    startTransition(async () => {
      setMessage(null);
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setDenied(permission === "denied");
          setMessage({
            ok: false,
            text: "Permissão negada. Libere as notificações nas configurações do navegador.",
          });
          return;
        }
        const registration = await navigator.serviceWorker.ready;
        const subscription =
          (await registration.pushManager.getSubscription()) ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          }));
        const result = await savePushSubscription(subscription.toJSON());
        if (!result.ok) {
          await subscription.unsubscribe();
          setMessage({ ok: false, text: result.message ?? "Não foi possível ativar." });
          return;
        }
        setActive(true);
        setMessage({ ok: true, text: "Avisos ativados neste aparelho." });
      } catch (error) {
        console.error("[push] falha ao ativar", error);
        setMessage({ ok: false, text: "Não foi possível ativar neste navegador." });
      }
    });
  }

  function disable() {
    startTransition(async () => {
      setMessage(null);
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await removePushSubscription(subscription.endpoint);
          await subscription.unsubscribe();
        }
        setActive(false);
        setMessage({ ok: true, text: "Avisos desativados neste aparelho." });
      } catch {
        setMessage({ ok: false, text: "Não foi possível desativar agora." });
      }
    });
  }

  function test() {
    startTransition(async () => {
      const result = await sendTestPush();
      setMessage({ ok: Boolean(result.ok), text: result.message ?? "" });
    });
  }

  if (support === "checking")
    return <p className="text-sm text-ink-500">Verificando este aparelho…</p>;
  if (support === "ios-needs-install") {
    return (
      <Alert tone="info">
        No iPhone, instale o app primeiro: no Safari, toque em Compartilhar → Adicionar à Tela de
        Início. Depois abra o app pelo ícone e ative os avisos aqui.
      </Alert>
    );
  }
  if (support === "unsupported") {
    return <Alert tone="warning">Este navegador não suporta avisos no celular.</Alert>;
  }

  return (
    <div className="space-y-3">
      {denied ? (
        <Alert tone="warning">
          As notificações estão bloqueadas neste navegador. Libere nas configurações do site e volte
          aqui.
        </Alert>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        {active ? (
          <>
            <Button type="button" variant="secondary" onClick={test} disabled={pending}>
              Enviar um teste
            </Button>
            <Button type="button" variant="ghost" onClick={disable} disabled={pending}>
              Desativar neste aparelho
            </Button>
          </>
        ) : (
          <Button type="button" onClick={enable} disabled={pending || denied}>
            Ativar avisos neste aparelho
          </Button>
        )}
      </div>
      {message ? <Alert tone={message.ok ? "success" : "error"}>{message.text}</Alert> : null}
    </div>
  );
}
