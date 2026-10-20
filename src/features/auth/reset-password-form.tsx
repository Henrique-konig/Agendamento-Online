"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { resetPassword } from "./actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, initialActionState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage ok={state.ok} message={state.message} />
      <input type="hidden" name="token" value={token} />
      <Field
        label="Nova senha"
        name="password"
        hint="Mínimo de 8 caracteres."
        errors={errors.password}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>
      <Field label="Repita a nova senha" name="confirm" errors={errors.confirm}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton className="w-full" pendingText="Salvando…">
        Salvar nova senha
      </SubmitButton>
      <p className="text-center text-sm text-ink-500">
        <Link href="/esqueci-senha" className="font-medium text-brand-700 hover:underline">
          Pedir outro link
        </Link>
      </p>
    </form>
  );
}
