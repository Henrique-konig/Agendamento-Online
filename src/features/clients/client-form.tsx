"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import type { Tables } from "@/types/database";
import { updateClient } from "./actions";

export function ClientForm({ client }: { client: Tables<"clients"> }) {
  const [state, action] = useActionState(updateClient, initialActionState);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage ok={state.ok} message={state.message} />
      <input type="hidden" name="id" value={client.id} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome" name="name" errors={e.name}>
          <Input id="name" name="name" defaultValue={client.name} />
        </Field>
        <Field label="E-mail" name="email" errors={e.email}>
          <Input id="email" name="email" type="email" defaultValue={client.email ?? ""} />
        </Field>
      </div>
      <Field
        label="Anotações"
        name="notes"
        hint="Preferências, alergias, histórico — só você vê."
        errors={e.notes}
      >
        <Textarea id="notes" name="notes" rows={4} defaultValue={client.notes ?? ""} />
      </Field>
      <div className="flex justify-end">
        <SubmitButton>Salvar</SubmitButton>
      </div>
    </form>
  );
}
