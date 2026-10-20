import type { Metadata } from "next";
import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-xl font-semibold">Crie sua conta</h1>
      <p className="text-ink-500 mt-1 mb-6 text-sm">Sua página fica pronta em poucos minutos.</p>
      <SignUpForm />
    </>
  );
}
