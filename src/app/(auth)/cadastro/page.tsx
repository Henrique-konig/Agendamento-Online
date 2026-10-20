import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/features/auth/sign-up-form";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Criar conta" };

export default async function SignUpPage() {
  if (await getUser()) redirect("/painel");
  return (
    <>
      <h1 className="text-2xl font-semibold">Crie sua conta</h1>
      <p className="mt-1 mb-6 text-sm text-ink-500">Sua página fica pronta em poucos minutos.</p>
      <SignUpForm />
    </>
  );
}
