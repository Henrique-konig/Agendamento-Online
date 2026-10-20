import type { Metadata } from "next";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { NotificationSettingsForm } from "@/features/notifications/settings-form";
import { getUser, requireProfessional } from "@/lib/auth";
import { dateFormatters } from "@/lib/format/date";
import { isEmailConfigured } from "@/lib/notifications/email";
import { isWhatsAppConfigured } from "@/lib/notifications/whatsapp";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Notificações" };

const kindLabel: Record<string, string> = {
  booking_confirmation: "Confirmação ao cliente",
  booking_new_professional: "Aviso de novo agendamento",
  reminder: "Lembrete",
  cancellation_client: "Cancelamento ao cliente",
  cancellation_professional: "Aviso de cancelamento",
  quote_new_professional: "Aviso de orçamento",
};

const statusTone = {
  sent: "text-brand-700",
  failed: "text-red-600",
  skipped: "text-ink-400",
} as const;

const statusLabel = { sent: "Enviado", failed: "Falhou", skipped: "Não enviado" } as const;

export default async function NotificationsPage() {
  const [professional, user] = await Promise.all([requireProfessional(), getUser()]);
  const log = await db.notificationLog.findMany({
    where: { professional_id: professional.id },
    orderBy: { created_at: "desc" },
    take: 30,
  });
  const f = dateFormatters(professional.timezone);

  return (
    <>
      <PageHeader
        title="Notificações"
        description="Confirmações, avisos e lembretes automáticos para reduzir faltas."
      />
      <div className="space-y-6">
        <NotificationSettingsForm
          professional={professional}
          accountEmail={user?.email ?? ""}
          emailConfigured={isEmailConfigured()}
          whatsappConfigured={isWhatsAppConfigured()}
        />
        <Card>
          <CardHeader title="Últimos envios" />
          {log.length ? (
            <ul className="divide-y divide-ink-100 text-sm">
              {log.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                >
                  <span>
                    <span className="text-ink-900">{kindLabel[entry.kind] ?? entry.kind}</span>
                    <span className="text-ink-500">
                      {" "}
                      · {entry.channel === "email" ? "E-mail" : "WhatsApp"}
                      {entry.recipient ? ` · ${entry.recipient}` : ""}
                    </span>
                  </span>
                  <span className="flex items-center gap-3 text-xs">
                    <span
                      className={cn("font-medium", statusTone[entry.status])}
                      title={entry.error ?? undefined}
                    >
                      {statusLabel[entry.status]}
                    </span>
                    <span className="text-ink-400">
                      {f.short(entry.created_at)} {f.time(entry.created_at)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">Nenhum envio ainda.</p>
          )}
        </Card>
      </div>
    </>
  );
}
