"use client";

import { useEffect } from "react";

/** Registra o service worker (só em produção, para não atrapalhar o dev). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error) => console.warn("[pwa] service worker não registrado", error));
  }, []);

  return null;
}
