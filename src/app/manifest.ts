import type { MetadataRoute } from "next";

/**
 * Manifesto do PWA: quem instala é o profissional, então o app abre direto
 * no painel (sem sessão, o proxy leva para /entrar).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/painel",
    name: "Agenda Autônomo",
    short_name: "Agenda",
    description: "Sua agenda, clientes e orçamentos no bolso.",
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/painel",
    scope: "/",
    display: "standalone",
    background_color: "#f4f7f7",
    theme_color: "#0f6a6e",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Agenda",
        url: "/painel/agenda",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Novo agendamento",
        short_name: "Novo",
        url: "/painel/agenda/novo",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Clientes",
        url: "/painel/clientes",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
