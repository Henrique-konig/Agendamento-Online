"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { createManualAppointment } from "./actions";

type Props = {
  services: Array<{ id: string; name: string }>;
  defaultDate: string;
};

export function ManualAppointmentForm({ services, defaultDate }: Props) {
  const [state, action] = useActionState(createManualAppointment, initialActionState);
  const e = state.fieldErrors ?? {};

  return (
    <form action={action} noValidate>
      <Card className="space-y-5">
        <FormMessage ok={state.ok} message={state.message} />
        <Field label="Serviço" name="service_id" errors={e.service_id}>
          <Select id="service_id" name="service_id" defaultValue="">
            <option value="" disabled>
              Escolha…
            </option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Data" name="date" errors={e.date}>
            <Input id="date" name="date" type="date" defaultValue={defaultDate} />
          </Field>
          <Field label="Horário" name="time" errors={e.time}>
            <Input id="time" name="time" type="time" step={300} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nome do cliente" name="name" errors={e.name}>
            <Input id="name" name="name" />
          </Field>
          <Field label="WhatsApp" name="phone" errors={e.phone}>
            <Input id="phone" name="phone" type="tel" placeholder="(51) 99999-8888" />
          </Field>
        </div>
        <Field label="E-mail (opcional)" name="email" errors={e.email}>
          <Input id="email" name="email" type="email" />
        </Field>
        <Field label="Observações" name="notes" errors={e.notes}>
          <Textarea id="notes" name="notes" rows={2} />
        </Field>
        <div className="border-ink-100 flex justify-end gap-2 border-t pt-5">
          <LinkButton href="/painel/agenda" variant="ghost">
            Cancelar
          </LinkButton>
          <SubmitButton>Agendar</SubmitButton>
        </div>
      </Card>
    </form>
  );
}
