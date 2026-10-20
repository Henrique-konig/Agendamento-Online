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
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xs ring-1 ring-ink-200/70">
        <h1 className="text-xl font-semibold">Vamos configurar sua página</h1>
        <p className="mt-1 mb-6 text-sm text-ink-500">Você pode alterar tudo depois no painel.</p>
        <OnboardingForm siteHost={new URL(siteUrl()).host} />
      </div>
    </main>
  );
}
