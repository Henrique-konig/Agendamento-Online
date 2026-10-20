"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { formatPhoneBR } from "@/lib/format/contact";
import { UFS } from "@/lib/validation/fields";
import type { Tables } from "@/types/database";
import { updateProfile } from "./actions";

export function ProfileForm({
  professional,
  siteHost,
}: {
  professional: Tables<"professionals">;
  siteHost: string;
}) {
  const [state, action] = useActionState(updateProfile, initialActionState);
  const e = state.fieldErrors ?? {};
  const p = professional;

  return (
    <form action={action} className="space-y-6" noValidate>
      <FormMessage ok={state.ok} message={state.message} />

      <Card>
        <CardHeader title="Apresentação" description="Como você aparece para os clientes." />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nome exibido" name="display_name" errors={e.display_name}>
            <Input id="display_name" name="display_name" defaultValue={p.display_name} required />
          </Field>
          <Field label="Profissão" name="profession" errors={e.profession}>
            <Input id="profession" name="profession" defaultValue={p.profession} required />
          </Field>
          <Field
            label="Endereço da página"
            name="slug"
            hint={`${siteHost}/${p.slug} — mudar quebra links já compartilhados.`}
            errors={e.slug}
            className="sm:col-span-2"
          >
            <Input id="slug" name="slug" defaultValue={p.slug} required />
          </Field>
          <Field
            label="Sobre você"
            name="bio"
            hint="Experiência, especialidades, diferenciais."
            errors={e.bio}
            className="sm:col-span-2"
          >
            <Textarea id="bio" name="bio" rows={5} defaultValue={p.bio ?? ""} maxLength={2000} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Contato" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="WhatsApp" name="whatsapp" errors={e.whatsapp}>
            <Input
              id="whatsapp"
              name="whatsapp"
              inputMode="tel"
              placeholder="(51) 99999-8888"
              defaultValue={p.whatsapp ? formatPhoneBR(p.whatsapp) : ""}
            />
          </Field>
          <Field label="Telefone fixo" name="phone" errors={e.phone}>
            <Input id="phone" name="phone" inputMode="tel" defaultValue={p.phone ?? ""} />
          </Field>
          <Field label="E-mail de contato" name="contact_email" errors={e.contact_email}>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              defaultValue={p.contact_email ?? ""}
            />
          </Field>
          <Field label="Instagram" name="instagram" errors={e.instagram}>
            <Input
              id="instagram"
              name="instagram"
              placeholder="@seuperfil"
              defaultValue={p.instagram ? `@${p.instagram}` : ""}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Localização"
          description="Use exatamente os mesmos dados do seu perfil no Google Meu Negócio."
        />
        <div className="grid gap-5 sm:grid-cols-6">
          <Field
            label="Endereço"
            name="address_line"
            errors={e.address_line}
            className="sm:col-span-4"
          >
            <Input
              id="address_line"
              name="address_line"
              placeholder="Rua, número, complemento"
              defaultValue={p.address_line ?? ""}
            />
          </Field>
          <Field label="CEP" name="postal_code" errors={e.postal_code} className="sm:col-span-2">
            <Input
              id="postal_code"
              name="postal_code"
              inputMode="numeric"
              defaultValue={p.postal_code ?? ""}
            />
          </Field>
          <Field
            label="Bairro"
            name="neighborhood"
            errors={e.neighborhood}
            className="sm:col-span-2"
          >
            <Input id="neighborhood" name="neighborhood" defaultValue={p.neighborhood ?? ""} />
          </Field>
          <Field label="Cidade" name="city" errors={e.city} className="sm:col-span-3">
            <Input id="city" name="city" defaultValue={p.city ?? ""} />
          </Field>
          <Field label="UF" name="state" errors={e.state} className="sm:col-span-1">
            <Select id="state" name="state" defaultValue={p.state ?? ""}>
              <option value="">—</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Área de atendimento"
            name="service_area"
            hint="Para quem atende em domicílio. Ex.: Zona Sul de Porto Alegre."
            errors={e.service_area}
            className="sm:col-span-6"
          >
            <Input id="service_area" name="service_area" defaultValue={p.service_area ?? ""} />
          </Field>
          <label className="text-ink-700 flex items-center gap-2 text-sm sm:col-span-6">
            <input
              type="checkbox"
              name="show_address"
              defaultChecked={p.show_address}
              className="border-ink-300 text-brand-600 size-4 rounded"
            />
            Mostrar endereço e mapa na página
          </label>
        </div>
      </Card>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="published"
            defaultChecked={p.published}
            className="border-ink-300 text-brand-600 mt-0.5 size-4 rounded"
          />
          <span>
            <span className="text-ink-900 font-medium">Página publicada</span>
            <span className="text-ink-500 block">Desmarque para tirar a página do ar.</span>
          </span>
        </label>
        <SubmitButton>Salvar alterações</SubmitButton>
      </Card>
    </form>
  );
}
