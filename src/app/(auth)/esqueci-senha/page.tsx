import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default async function ForgotPasswordPage() {
  if (await getUser()) redirect("/painel");
  return (
    <>
      <h1 className="text-2xl font-semibold">Esqueci minha senha</h1>
      <p className="mt-1 mb-6 text-sm text-ink-500">
        Informe o e-mail da conta e enviaremos um link para criar uma nova senha.
      </p>
      <ForgotPasswordForm />
    </>
  );
}
