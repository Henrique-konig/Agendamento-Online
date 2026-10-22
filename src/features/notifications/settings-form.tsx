"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import type { Professional } from "@/types/models";
import { saveNotificationSettings } from "./settings";

type Props = {
  professional: Professional;
  accountEmail: string;
  emailConfigured: boolean;
  whatsappConfigured: boolean;
};

export function NotificationSettingsForm({
  professional: p,
  accountEmail,
  emailConfigured,
  whatsappConfigured,
}: Props) {
  const [state, action] = useActionState(saveNotificationSettings, initialActionState);
  const e = state.fieldErrors ?? {};

  return (
    <form action={action}>
      <Card>
        <CardHeader title="Preferências" />
        <div className="space-y-5">
          <FormMessage ok={state.ok} message={state.message} />
          <Field
            label="E-mail para avisos"
            name="notification_email"
            hint={`Em branco usa o e-mail da conta (${accountEmail}).`}
            errors={e.notification_email}
          >
            <Input
              id="notification_email"
              name="notification_email"
              type="email"
              defaultValue={p.notification_email ?? ""}
            />
          </Field>
          <Toggle
            name="notify_new_booking"
            defaultChecked={p.notify_new_booking}
            title="Avisar-me de novos agendamentos, cancelamentos e orçamentos"
          />
          <Toggle
            name="reminder_email"
            defaultChecked={p.reminder_email}
            title="Lembrete por e-mail ao cliente no dia anterior"
            description="Enviado quando o cliente informa e-mail ao agendar."
            disabled={!emailConfigured}
          />
          <Toggle
            name="reminder_whatsapp"
            defaultChecked={p.reminder_whatsapp}
            title="Lembrete por WhatsApp ao cliente no dia anterior"
            description={
              whatsappConfigured
                ? "Enviado pelo número oficial configurado na plataforma."
                : "Indisponível: a integração com WhatsApp ainda não foi configurada."
            }
            disabled={!whatsappConfigured}
          />
          <Toggle
            name="ask_reviews"
            defaultChecked={p.ask_reviews}
            title="Pedir avaliação ao cliente depois do atendimento"
            description="Um e-mail no dia seguinte, quando o cliente informou o e-mail ao agendar."
            disabled={!emailConfigured}
          />
        </div>
        <div className="mt-6 flex justify-end">
          <SubmitButton>Salvar</SubmitButton>
        </div>
      </Card>
    </form>
  );
}

function Toggle({
  name,
  title,
  description,
  defaultChecked,
  disabled,
}: {
  name: string;
  title: string;
  description?: string;
  defaultChecked: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked && !disabled}
        disabled={disabled}
        className="mt-0.5 size-4 rounded border-ink-300"
      />
      <span className={disabled ? "opacity-60" : undefined}>
        <span className="font-medium text-ink-900">{title}</span>
        {description ? <span className="block text-ink-500">{description}</span> : null}
      </span>
    </label>
  );
}
