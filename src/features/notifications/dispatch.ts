import "server-only";
import { siteUrl } from "@/lib/env";
import { sendEmail, type EmailMessage } from "@/lib/notifications/email";
import type { DeliveryResult } from "@/lib/notifications/types";
import { isWhatsAppConfigured, sendWhatsAppTemplate } from "@/lib/notifications/whatsapp";
import { integrationsEnv } from "@/lib/env";
import { db } from "@/lib/db";
import type { NotificationChannel, Professional } from "@/types/models";
import {
  cancellationEmail,
  clientConfirmationEmail,
  newQuoteEmail,
  professionalNewBookingEmail,
  reminderEmail,
  reminderWhatsAppParams,
  type AppointmentContext,
} from "./templates";

type LoadedAppointment = {
  ctx: AppointmentContext;
  professional: Professional;
  professionalEmail: string | null;
};

async function professionalEmail(professional: Professional) {
  if (professional.notification_email) return professional.notification_email;
  const user = await db.user.findUnique({
    where: { id: professional.id },
    select: { email: true },
  });
  return user?.email ?? null;
}

export async function loadAppointmentContext(
  appointmentId: string,
): Promise<LoadedAppointment | null> {
  const data = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { client: true, professional: true },
  });
  if (!data) return null;

  const p = data.professional;
  const location = p.show_address
    ? [p.address_line, p.neighborhood, p.city, p.state].filter(Boolean).join(", ") || null
    : null;

  return {
    professional: p,
    professionalEmail: await professionalEmail(p),
    ctx: {
      appointmentId: data.id,
      serviceName: data.service_name,
      startsAt: data.starts_at.toISOString(),
      endsAt: data.ends_at.toISOString(),
      priceCents: data.price_cents,
      status: data.status,
      paymentStatus: data.payment_status,
      paymentAmountCents: data.payment_amount_cents,
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

async function log(entry: {
  professionalId: string;
  appointmentId?: string;
  quoteId?: string;
  kind: string;
  channel: NotificationChannel;
  recipient: string | null;
  result: DeliveryResult;
}) {
  const { result } = entry;
  await db.notificationLog.create({
    data: {
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
    },
  });
}

async function email(
  meta: { professionalId: string; appointmentId?: string; quoteId?: string; kind: string },
  message: Omit<EmailMessage, "to"> & { to: string | null },
) {
  const result: DeliveryResult = message.to
    ? await sendEmail({ ...message, to: message.to })
    : { status: "skipped", reason: "sem e-mail" };
  await log({ ...meta, channel: "email", recipient: message.to, result });
  return result;
}

/** Confirmação para o cliente e aviso para o profissional. */
export async function notifyBookingCreated(appointmentId: string) {
  const loaded = await loadAppointmentContext(appointmentId);
  if (!loaded) return;
  const { ctx, professional } = loaded;
  const meta = { professionalId: professional.id, appointmentId };

  await email(
    { ...meta, kind: "booking_confirmation" },
    {
      to: ctx.client.email,
      ...clientConfirmationEmail(ctx),
      idempotencyKey: `confirmation-${appointmentId}`,
    },
  );

  if (professional.notify_new_booking) {
    await email(
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

/** Pagamento antecipado confirmado: confirmação ao cliente e aviso ao profissional. */
export async function notifyPaymentConfirmed(appointmentId: string) {
  const loaded = await loadAppointmentContext(appointmentId);
  if (!loaded) return;
  const { ctx, professional } = loaded;
  const meta = { professionalId: professional.id, appointmentId };

  await email(
    { ...meta, kind: "payment_confirmed_client" },
    {
      to: ctx.client.email,
      ...clientConfirmationEmail(ctx),
      idempotencyKey: `paid-client-${appointmentId}`,
    },
  );
  if (professional.notify_new_booking) {
    await email(
      { ...meta, kind: "payment_confirmed_professional" },
      {
        to: loaded.professionalEmail,
        ...professionalNewBookingEmail(ctx),
        idempotencyKey: `paid-pro-${appointmentId}`,
      },
    );
  }
}

export async function notifyBookingCancelled(appointmentId: string) {
  const loaded = await loadAppointmentContext(appointmentId);
  if (!loaded) return;
  const { ctx, professional } = loaded;
  const meta = { professionalId: professional.id, appointmentId };

  await email(
    { ...meta, kind: "cancellation_client" },
    {
      to: ctx.client.email,
      ...cancellationEmail(ctx, "client"),
      idempotencyKey: `cancel-client-${appointmentId}`,
    },
  );
  if (professional.notify_new_booking) {
    await email(
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
export async function sendReminder(appointmentId: string) {
  const loaded = await loadAppointmentContext(appointmentId);
  if (!loaded) return;
  const { ctx, professional } = loaded;
  const meta = { professionalId: professional.id, appointmentId, kind: "reminder" };

  if (professional.reminder_email) {
    await email(meta, {
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
    await log({ ...meta, channel: "whatsapp", recipient: ctx.client.phone, result });
  }
}

export async function notifyNewQuote(quoteId: string) {
  const quote = await db.quoteRequest.findUnique({
    where: { id: quoteId },
    include: { professional: true },
  });
  if (!quote?.professional.notify_new_booking) return;

  await email(
    { professionalId: quote.professional_id, quoteId, kind: "quote_new_professional" },
    {
      to: await professionalEmail(quote.professional),
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
