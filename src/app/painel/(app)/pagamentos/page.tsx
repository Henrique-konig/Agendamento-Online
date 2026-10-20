import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { PixSettingsForm } from "@/features/payments/settings-form";
import { getPixSettings } from "@/features/payments/settings";
import { requireProfessional } from "@/lib/auth";
import { integrationsEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Pagamentos" };

export default async function PaymentsPage() {
  const professional = await requireProfessional();
  const settings = await getPixSettings(professional.id);

  return (
    <>
      <PageHeader
        title="Pagamentos"
        description="Opcional: reduza faltas cobrando um sinal via Pix ao agendar."
      />
      <div className="space-y-6">
        <PixSettingsForm
          // Nunca enviamos o token ao navegador, só se ele existe.
          settings={{
            enabled: settings?.enabled ?? false,
            mode: settings?.mode ?? "manual",
            pix_key: settings?.pix_key ?? null,
            merchant_name: settings?.merchant_name ?? null,
            merchant_city: settings?.merchant_city ?? null,
            has_mp_token: Boolean(settings?.mp_access_token_enc),
            deposit_percent: settings?.deposit_percent ?? 100,
            hold_minutes: settings?.hold_minutes ?? 30,
          }}
          mercadoPagoAvailable={Boolean(integrationsEnv().PAYMENT_ENCRYPTION_KEY)}
          defaults={{ name: professional.display_name, city: professional.city ?? "" }}
        />
        <Alert tone="info">
          Cancelamentos de agendamentos já pagos não geram estorno automático: devolva o valor pelo
          seu banco ou pelo Mercado Pago.
        </Alert>
      </div>
    </>
  );
}
