/** Tipos de linha do banco, reexportados do Prisma para o resto do app. */
export type {
  Appointment,
  AvailabilityRule,
  Client,
  GoogleConnection,
  NotificationLog,
  Photo,
  PixSettings,
  Professional,
  QuoteRequest,
  Service,
  TimeOff,
} from "@/generated/prisma/client";

export type {
  AppointmentStatus,
  NotificationChannel,
  NotificationStatus,
  PaymentStatus,
  PixMode,
  QuoteStatus,
} from "@/generated/prisma/enums";
