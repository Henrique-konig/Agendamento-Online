import type { Metadata } from "next";
import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Crie sua conta</h1>
      <p className="mt-1 mb-6 text-sm text-ink-500">Sua página fica pronta em poucos minutos.</p>
      <SignUpForm />
    </>
  );
}
