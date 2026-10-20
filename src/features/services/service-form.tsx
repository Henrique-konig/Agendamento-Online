"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { centsToInput } from "@/lib/format/money";
import type { Tables } from "@/types/database";
import { saveService } from "./actions";

export function ServiceForm({ service }: { service?: Tables<"services"> }) {
  const [state, action] = useActionState(saveService, initialActionState);
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} noValidate>
      <Card className="space-y-5">
        <FormMessage ok={state.ok} message={state.message} />
        {service ? <input type="hidden" name="id" value={service.id} /> : null}
        <Field label="Nome" name="name" errors={e.name}>
          <Input id="name" name="name" defaultValue={service?.name} placeholder="Corte masculino" />
        </Field>
        <Field label="Descrição" name="description" errors={e.description}>
          <Textarea
            id="description"
            name="description"
            rows={3}
            maxLength={500}
            defaultValue={service?.description ?? ""}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Duração (minutos)" name="duration_minutes" errors={e.duration_minutes}>
            <Input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              min={5}
              max={720}
              step={5}
              defaultValue={service?.duration_minutes ?? 60}
            />
          </Field>
          <Field
            label="Preço (R$)"
            name="price"
            hint="Deixe em branco para “sob consulta”."
            errors={e.price}
          >
            <Input
              id="price"
              name="price"
              inputMode="decimal"
              placeholder="45,00"
              defaultValue={centsToInput(service?.price_cents)}
            />
          </Field>
        </div>
        <fieldset className="space-y-3">
          <legend className="sr-only">Opções</legend>
          <Checkbox
            name="price_is_starting"
            label="Preço “a partir de”"
            defaultChecked={service?.price_is_starting}
          />
          <Checkbox
            name="requires_quote"
            label="Exige avaliação — o cliente pede orçamento em vez de agendar"
            defaultChecked={service?.requires_quote}
          />
          <Checkbox
            name="active"
            label="Ativo (visível na página)"
            defaultChecked={service?.active ?? true}
          />
        </fieldset>
        <div className="border-ink-100 flex justify-end gap-2 border-t pt-5">
          <LinkButton href="/painel/servicos" variant="ghost">
            Cancelar
          </LinkButton>
          <SubmitButton>{service ? "Salvar" : "Criar serviço"}</SubmitButton>
        </div>
      </Card>
    </form>
  );
}

function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="text-ink-700 flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="border-ink-300 text-brand-600 size-4 rounded"
      />
      {label}
    </label>
  );
}
