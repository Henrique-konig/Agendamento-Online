"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { signUp } from "./actions";

export function SignUpForm() {
  const [state, action] = useActionState(signUp, initialActionState);
  const errors = state.fieldErrors ?? {};

  if (state.ok) return <FormMessage ok message={state.message} />;

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage ok={state.ok} message={state.message} />
      <Field label="E-mail" name="email" errors={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Senha" name="password" hint="Mínimo de 8 caracteres." errors={errors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>
      <SubmitButton className="w-full" pendingText="Criando conta…">
        Criar conta
      </SubmitButton>
      <p className="text-ink-500 text-center text-sm">
        Já tem conta?{" "}
        <Link href="/entrar" className="text-brand-700 font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
