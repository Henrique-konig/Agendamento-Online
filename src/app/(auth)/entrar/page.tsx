import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { SignInForm } from "@/features/auth/sign-in-form";
import { safeNextPath } from "@/features/auth/schemas";

export const metadata: Metadata = { title: "Entrar" };

export default async function SignInPage(props: PageProps<"/entrar">) {
  const searchParams = await props.searchParams;
  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">Entrar no painel</h1>
      {searchParams.erro === "link-invalido" ? (
        <div className="mb-5">
          <Alert tone="error">O link expirou ou é inválido. Entre ou peça um novo link.</Alert>
        </div>
      ) : null}
      <SignInForm next={safeNextPath(searchParams.proximo)} />
    </>
  );
}
