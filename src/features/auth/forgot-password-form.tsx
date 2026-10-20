"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { requestPasswordReset } from "./actions";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initialActionState);
  const errors = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <div className="space-y-5">
        <FormMessage ok message={state.message} />
        <p className="text-sm text-ink-500">Não chegou? Confira o spam. O link vale por 1 hora.</p>
        <Link href="/entrar" className="text-sm font-medium text-brand-700 hover:underline">
          Voltar para entrar
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage ok={state.ok} message={state.message} />
      <Field label="E-mail da conta" name="email" errors={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          required
        />
      </Field>
      <SubmitButton className="w-full" pendingText="Enviando…">
        Enviar link
      </SubmitButton>
      <p className="text-center text-sm text-ink-500">
        <Link href="/entrar" className="font-medium text-brand-700 hover:underline">
          Voltar para entrar
        </Link>
      </p>
    </form>
  );
}
