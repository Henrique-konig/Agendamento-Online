import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/features/pwa/service-worker";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--nf-display",
  subsets: ["latin"],
  display: "swap",
});
const body = Instrument_Sans({ variable: "--nf-body", subsets: ["latin"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--nf-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Agenda Autônomo — agendamento online para profissionais",
    template: "%s · Agenda Autônomo",
  },
  description:
    "Página profissional com serviços, preços e agendamento online para barbeiros, nutricionistas, eletricistas e outros autônomos.",
  applicationName: "Agenda Autônomo",
  appleWebApp: { capable: true, title: "Agenda", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0f6a6e",
  // Ocupa a tela toda no celular (inclusive sob o notch); as áreas seguras
  // são respeitadas com env(safe-area-inset-*) no layout.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
