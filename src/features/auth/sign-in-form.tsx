"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { signIn } from "./actions";

export function SignInForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signIn, initialActionState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage ok={state.ok} message={state.message} />
      <input type="hidden" name="proximo" value={next ?? "/painel"} />
      <Field label="E-mail" name="email" errors={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          required
        />
      </Field>
      <Field label="Senha" name="password" errors={errors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <div className="-mt-2 text-right">
        <Link
          href="/esqueci-senha"
          className="text-xs text-ink-500 hover:text-brand-700 hover:underline"
        >
          Esqueci minha senha
        </Link>
      </div>
      <SubmitButton className="w-full" pendingText="Entrando…">
        Entrar
      </SubmitButton>
      <p className="text-center text-sm text-ink-500">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-brand-700 hover:underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
