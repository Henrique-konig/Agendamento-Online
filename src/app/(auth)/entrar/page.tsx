import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { SignInForm } from "@/features/auth/sign-in-form";
import { safeNextPath } from "@/features/auth/schemas";

export const metadata: Metadata = { title: "Entrar" };

export default async function SignInPage(props: PageProps<"/entrar">) {
  const searchParams = await props.searchParams;
  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Bem-vindo de volta</h1>
      <p className="mb-6 text-sm text-ink-500">Entre para ver a sua agenda.</p>
      {searchParams.erro === "link-invalido" ? (
        <div className="mb-5">
          <Alert tone="error">O link expirou ou é inválido. Entre ou peça um novo link.</Alert>
        </div>
      ) : null}
      <SignInForm next={safeNextPath(searchParams.proximo)} />
    </>
  );
}
