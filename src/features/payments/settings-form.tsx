"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { savePixSettings } from "./actions";

export type PixSettingsView = {
  enabled: boolean;
  mode: "manual" | "mercadopago";
  pix_key: string | null;
  merchant_name: string | null;
  merchant_city: string | null;
  has_mp_token: boolean;
  deposit_percent: number;
  hold_minutes: number;
};

export function PixSettingsForm({
  settings,
  mercadoPagoAvailable,
  defaults,
}: {
  settings: PixSettingsView;
  mercadoPagoAvailable: boolean;
  defaults: { name: string; city: string };
}) {
  const [state, action] = useActionState(savePixSettings, initialActionState);
  const [mode, setMode] = useState(settings.mode);
  const e = state.fieldErrors ?? {};

  return (
    <form action={action}>
      <Card>
        <CardHeader
          title="Pix antecipado"
          description="Cobre um sinal no momento do agendamento nos serviços que você escolher."
        />
        <div className="space-y-5">
          <FormMessage ok={state.ok} message={state.message} />
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={settings.enabled}
              className="mt-0.5 size-4 rounded border-ink-300"
            />
            <span>
              <span className="font-medium text-ink-900">Ativar cobrança via Pix</span>
              <span className="block text-ink-500">
                Depois, marque “exigir pagamento antecipado” nos serviços desejados.
              </span>
            </span>
          </label>

          <Field label="Como receber" name="mode">
            <Select
              id="mode"
              name="mode"
              value={mode}
              onChange={(ev) => setMode(ev.target.value as PixSettingsView["mode"])}
            >
              <option value="manual">Minha chave Pix — eu confirmo o recebimento</option>
              <option value="mercadopago" disabled={!mercadoPagoAvailable}>
                Mercado Pago — confirmação automática
              </option>
            </Select>
          </Field>

          {mode === "manual" ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Chave Pix" name="pix_key" errors={e.pix_key} className="sm:col-span-2">
                <Input
                  id="pix_key"
                  name="pix_key"
                  defaultValue={settings.pix_key ?? ""}
                  placeholder="CPF, CNPJ, e-mail, telefone (+55…) ou chave aleatória"
                />
              </Field>
              <Field
                label="Nome do recebedor"
                name="merchant_name"
                hint="Até 25 caracteres, como no banco."
                errors={e.merchant_name}
              >
                <Input
                  id="merchant_name"
                  name="merchant_name"
                  maxLength={25}
                  defaultValue={settings.merchant_name ?? defaults.name.slice(0, 25)}
                />
              </Field>
              <Field label="Cidade" name="merchant_city" errors={e.merchant_city}>
                <Input
                  id="merchant_city"
                  name="merchant_city"
                  maxLength={15}
                  defaultValue={settings.merchant_city ?? defaults.city.slice(0, 15)}
                />
              </Field>
            </div>
          ) : (
            <Field
              label="Access token de produção do Mercado Pago"
              name="mp_access_token"
              hint={
                settings.has_mp_token
                  ? "Token salvo (criptografado). Preencha só para trocar."
                  : "Mercado Pago → Seu negócio → Configurações → Credenciais de produção."
              }
              errors={e.mp_access_token}
            >
              <Input
                id="mp_access_token"
                name="mp_access_token"
                type="password"
                autoComplete="off"
                placeholder={settings.has_mp_token ? "••••••••" : "APP_USR-…"}
              />
            </Field>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Valor do sinal" name="deposit_percent">
              <Select
                id="deposit_percent"
                name="deposit_percent"
                defaultValue={settings.deposit_percent}
              >
                {[100, 50, 30, 20, 10].map((p) => (
                  <option key={p} value={p}>
                    {p === 100 ? "Valor integral" : `${p}% do valor`}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Prazo para pagar" name="hold_minutes">
              <Select id="hold_minutes" name="hold_minutes" defaultValue={settings.hold_minutes}>
                {[15, 30, 60, 120, 240].map((m) => (
                  <option key={m} value={m}>
                    {m < 60 ? `${m} minutos` : `${m / 60} hora(s)`}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <SubmitButton>Salvar</SubmitButton>
        </div>
      </Card>
    </form>
  );
}
