import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { SignInForm } from "@/features/auth/sign-in-form";
import { safeNextPath } from "@/features/auth/schemas";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar" };

export default async function SignInPage(props: PageProps<"/entrar">) {
  if (await getUser()) redirect("/painel");
  const searchParams = await props.searchParams;
  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Bem-vindo de volta</h1>
      <p className="mb-6 text-sm text-ink-500">Entre para ver a sua agenda.</p>
      {searchParams.senha === "alterada" ? (
        <div className="mb-5">
          <Alert tone="success">Senha alterada. Entre com a nova senha.</Alert>
        </div>
      ) : null}
      <SignInForm next={safeNextPath(searchParams.proximo)} />
    </>
  );
}
