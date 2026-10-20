"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/action-state";
import { slugify } from "@/lib/utils/slug";
import { completeOnboarding } from "./actions";

export function OnboardingForm({ siteHost }: { siteHost: string }) {
  const [state, action] = useActionState(completeOnboarding, initialActionState);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage ok={state.ok} message={state.message} />
      <Field label="Nome exibido" name="display_name" errors={errors.display_name}>
        <Input
          id="display_name"
          name="display_name"
          placeholder="Ex.: Barbearia do Zé"
          required
          onChange={(e) => {
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </Field>
      <Field label="Profissão" name="profession" errors={errors.profession}>
        <Input id="profession" name="profession" placeholder="Ex.: Barbeiro" required />
      </Field>
      <Field
        label="Endereço da sua página"
        name="slug"
        hint={`${siteHost}/${slug || "seu-nome"}`}
        errors={errors.slug}
      >
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          required
        />
      </Field>
      <SubmitButton className="w-full">Continuar</SubmitButton>
    </form>
  );
}
