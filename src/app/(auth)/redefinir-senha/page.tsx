import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { findUserByResetToken } from "@/features/auth/password-reset";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata: Metadata = { title: "Nova senha", robots: { index: false } };

export default async function ResetPasswordPage(props: PageProps<"/redefinir-senha">) {
  const searchParams = await props.searchParams;
  const token = typeof searchParams.token === "string" ? searchParams.token : "";
  const valid = token ? Boolean(await findUserByResetToken(token)) : false;

  return (
    <>
      <h1 className="text-2xl font-semibold">Escolha uma nova senha</h1>
      {valid ? (
        <>
          <p className="mt-1 mb-6 text-sm text-ink-500">
            Depois de salvar, entre com a senha nova.
          </p>
          <ResetPasswordForm token={token} />
        </>
      ) : (
        <div className="mt-6 space-y-5">
          <Alert tone="error">Este link expirou, já foi usado ou é inválido.</Alert>
          <Link
            href="/esqueci-senha"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            Pedir um novo link
          </Link>
        </div>
      )}
    </>
  );
}
