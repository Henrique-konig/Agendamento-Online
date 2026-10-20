import "server-only";
import { siteUrl } from "@/lib/env";
import { sendEmail, type EmailMessage } from "@/lib/notifications/email";
import type { DeliveryResult } from "@/lib/notifications/types";
import { isWhatsAppConfigured, sendWhatsAppTemplate } from "@/lib/notifications/whatsapp";
import { integrationsEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Tables } from "@/types/database";
import {
  cancellationEmail,
  clientConfirmationEmail,
  newQuoteEmail,
  professionalNewBookingEmail,
  reminderEmail,
  reminderWhatsAppParams,
  type AppointmentContext,
} from "./templates";

type Admin = ReturnType<typeof createAdminClient>;
type Channel = Database["public"]["Enums"]["notification_channel"];

type LoadedAppointment = {
  ctx: AppointmentContext;
  professional: Tables<"professionals">;
  professionalEmail: string | null;
};

async function professionalEmail(admin: Admin, professional: Tables<"professionals">) {
  if (professional.notification_email) return professional.notification_email;
  const { data } = await admin.auth.admin.getUserById(professional.id);
  return data.user?.email ?? null;
}

export async function loadAppointmentContext(
  admin: Admin,
  appointmentId: string,
): Promise<LoadedAppointment | null> {
  const { data } = await admin
    .from("appointments")
    .select("*, client:clients(name, phone, email), professional:professionals(*)")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!data?.client || !data.professional) return null;

  const p = data.professional;
  const location = p.show_address
    ? [p.address_line, p.neighborhood, p.city, p.state].filter(Boolean).join(", ") || null
    : null;

  return {
    professional: p,
    professionalEmail: await professionalEmail(admin, p),
    ctx: {
      appointmentId: data.id,
      serviceName: data.service_name,
      startsAt: data.starts_at,
      endsAt: data.ends_at,
      priceCents: data.price_cents,
      status: data.status,
      notes: data.notes,
      client: data.client,
      professional: {
        displayName: p.display_name,
        timezone: p.timezone,
        whatsapp: p.whatsapp,
        location,
      },
      manageUrl: siteUrl(`/${p.slug}/agendamento/${data.cancel_token}`),
      painelUrl: siteUrl("/painel/agenda"),
    },
  };
}

async function log(
  admin: Admin,
  entry: {
    professionalId: string;
    appointmentId?: string;
    quoteId?: string;
    kind: string;
    channel: Channel;
    recipient: string | null;
    result: DeliveryResult;
  },
) {
  const { result } = entry;
  await admin.from("notification_log").insert({
    professional_id: entry.professionalId,
    appointment_id: entry.appointmentId ?? null,
    quote_id: entry.quoteId ?? null,
    kind: entry.kind,
    channel: entry.channel,
    recipient: entry.recipient,
    status: result.status,
    provider_id: result.status === "sent" ? (result.providerId ?? null) : null,
    error:
      result.status === "failed"
        ? result.error
        : result.status === "skipped"
          ? result.reason
          : null,
  });
}

async function email(
  admin: Admin,
  meta: { professionalId: string; appointmentId?: string; quoteId?: string; kind: string },
  message: Omit<EmailMessage, "to"> & { to: string | null },
) {
  const result: DeliveryResult = message.to
    ? await sendEmail({ ...message, to: message.to })
    : { status: "skipped", reason: "sem e-mail" };
  await log(admin, { ...meta, channel: "email", recipient: message.to, result });
  return result;
}

/** Confirmação para o cliente e aviso para o profissional. */
export async function notifyBookingCreated(appointmentId: string) {
  const admin = createAdminClient();
  const loaded = await loadAppointmentContext(admin, appointmentId);
  if (!loaded) return;
  const { ctx, professional } = loaded;
  const meta = { professionalId: professional.id, appointmentId };

  await email(
    admin,
    { ...meta, kind: "booking_confirmation" },
    {
      to: ctx.client.email,
      ...clientConfirmationEmail(ctx),
      idempotencyKey: `confirmation-${appointmentId}`,
    },
  );

  if (professional.notify_new_booking) {
    await email(
      admin,
      { ...meta, kind: "booking_new_professional" },
      {
        to: loaded.professionalEmail,
        ...professionalNewBookingEmail(ctx),
        replyTo: ctx.client.email ?? undefined,
        idempotencyKey: `new-booking-${appointmentId}`,
      },
    );
  }
}

export async function notifyBookingCancelled(appointmentId: string) {
  const admin = createAdminClient();
  const loaded = await loadAppointmentContext(admin, appointmentId);
  if (!loaded) return;
  const { ctx, professional } = loaded;
  const meta = { professionalId: professional.id, appointmentId };

  await email(
    admin,
    { ...meta, kind: "cancellation_client" },
    {
      to: ctx.client.email,
      ...cancellationEmail(ctx, "client"),
      idempotencyKey: `cancel-client-${appointmentId}`,
    },
  );
  if (professional.notify_new_booking) {
    await email(
      admin,
      { ...meta, kind: "cancellation_professional" },
      {
        to: loaded.professionalEmail,
        ...cancellationEmail(ctx, "professional"),
        idempotencyKey: `cancel-pro-${appointmentId}`,
      },
    );
  }
}

/** Envia o lembrete do dia anterior pelos canais habilitados. */
export async function sendReminder(admin: Admin, appointmentId: string) {
  const loaded = await loadAppointmentContext(admin, appointmentId);
  if (!loaded) return;
  const { ctx, professional } = loaded;
  const meta = { professionalId: professional.id, appointmentId, kind: "reminder" };

  if (professional.reminder_email) {
    await email(admin, meta, {
      to: ctx.client.email,
      ...reminderEmail(ctx),
      idempotencyKey: `reminder-${appointmentId}`,
    });
  }

  if (professional.reminder_whatsapp) {
    const result: DeliveryResult = isWhatsAppConfigured()
      ? await sendWhatsAppTemplate({
          to: ctx.client.phone,
          template: integrationsEnv().WHATSAPP_REMINDER_TEMPLATE,
          bodyParams: reminderWhatsAppParams(ctx),
        })
      : { status: "skipped", reason: "WhatsApp não configurado" };
    await log(admin, { ...meta, channel: "whatsapp", recipient: ctx.client.phone, result });
  }
}

export async function notifyNewQuote(quoteId: string) {
  const admin = createAdminClient();
  const { data: quote } = await admin
    .from("quote_requests")
    .select("*, professional:professionals(*)")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote?.professional || !quote.professional.notify_new_booking) return;

  await email(
    admin,
    { professionalId: quote.professional_id, quoteId, kind: "quote_new_professional" },
    {
      to: await professionalEmail(admin, quote.professional),
      ...newQuoteEmail({
        name: quote.name,
        phone: quote.phone,
        email: quote.email,
        serviceName: quote.service_name,
        description: quote.description,
        location: quote.location,
        preferredPeriod: quote.preferred_period,
        painelUrl: siteUrl("/painel/orcamentos"),
      }),
      replyTo: quote.email ?? undefined,
      idempotencyKey: `quote-${quoteId}`,
    },
  );
}
