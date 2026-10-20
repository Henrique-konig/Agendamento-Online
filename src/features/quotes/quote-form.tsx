"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { createQuoteRequest } from "./actions";
import { PREFERRED_PERIODS } from "./schemas";

type Props = {
  slug: string;
  services: Array<{ id: string; name: string }>;
  defaultServiceId?: string;
};

export function QuoteForm({ slug, services, defaultServiceId }: Props) {
  const [state, action] = useActionState(createQuoteRequest, initialActionState);
  const e = state.fieldErrors ?? {};

  if (state.ok) return <FormMessage ok message={state.message} />;

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="slug" value={slug} />
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Não preencha
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <FormMessage ok={state.ok} message={state.message} />

      {services.length ? (
        <Field label="Serviço" name="service_id" errors={e.service_id}>
          <Select id="service_id" name="service_id" defaultValue={defaultServiceId ?? ""}>
            <option value="">Outro / não sei</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <Field
        label="O que você precisa?"
        name="description"
        hint="Quanto mais detalhes, mais preciso o orçamento. Fotos podem ser enviadas depois pelo WhatsApp."
        errors={e.description}
      >
        <Textarea id="description" name="description" rows={5} maxLength={3000} required />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Bairro / endereço do serviço" name="location" errors={e.location}>
          <Input id="location" name="location" />
        </Field>
        <Field label="Melhor período" name="preferred_period" errors={e.preferred_period}>
          <Select id="preferred_period" name="preferred_period" defaultValue="">
            <option value="">—</option>
            {PREFERRED_PERIODS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Nome" name="name" errors={e.name}>
        <Input id="name" name="name" autoComplete="name" required />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="WhatsApp" name="phone" errors={e.phone}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(51) 99999-8888"
            required
          />
        </Field>
        <Field label="E-mail (opcional)" name="email" errors={e.email}>
          <Input id="email" name="email" type="email" autoComplete="email" />
        </Field>
      </div>
      <SubmitButton size="lg" className="w-full" pendingText="Enviando…">
        Pedir orçamento
      </SubmitButton>
    </form>
  );
}
