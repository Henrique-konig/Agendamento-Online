import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { OnboardingForm } from "@/features/onboarding/onboarding-form";
import { getCurrentProfessional, requireUser } from "@/lib/auth";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = { title: "Boas-vindas" };

export default async function OnboardingPage() {
  await requireUser();
  if (await getCurrentProfessional()) redirect("/painel");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mb-8">
        <Brand />
      </div>
      <div className="ring-ink-200/70 w-full max-w-md rounded-2xl bg-white p-8 shadow-xs ring-1">
        <h1 className="text-xl font-semibold">Vamos configurar sua página</h1>
        <p className="text-ink-500 mt-1 mb-6 text-sm">Você pode alterar tudo depois no painel.</p>
        <OnboardingForm siteHost={new URL(siteUrl()).host} />
      </div>
    </main>
  );
}
