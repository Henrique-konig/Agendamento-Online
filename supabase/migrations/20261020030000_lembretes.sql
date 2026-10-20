-- =============================================================================
-- Etapa 3 — Lembretes e notificações
-- =============================================================================

alter table public.professionals
  add column notification_email     text check (char_length(notification_email) <= 254),
  add column notify_new_booking     boolean not null default true,
  add column reminder_email         boolean not null default true,
  add column reminder_whatsapp      boolean not null default false;

comment on column public.professionals.notification_email is
  'Onde o profissional recebe avisos de novos agendamentos. Nulo = e-mail da conta.';

alter table public.appointments
  add column reminder_sent_at timestamptz;

-- Busca rápida de lembretes pendentes
create index appointments_reminder_pending_idx
  on public.appointments (starts_at)
  where reminder_sent_at is null and status = 'confirmed';

-- Registro de envios (auditoria e diagnóstico) -----------------------------------
create type public.notification_channel as enum ('email', 'whatsapp');
create type public.notification_status as enum ('sent', 'failed', 'skipped');

create table public.notification_log (
  id               uuid primary key default gen_random_uuid(),
  professional_id  uuid not null references public.professionals (id) on delete cascade,
  appointment_id   uuid references public.appointments (id) on delete cascade,
  quote_id         uuid references public.quote_requests (id) on delete cascade,
  kind             text not null,
  channel          public.notification_channel not null,
  recipient        text,
  status           public.notification_status not null,
  provider_id      text,
  error            text,
  created_at       timestamptz not null default now()
);

create index notification_log_professional_idx
  on public.notification_log (professional_id, created_at desc);

alter table public.notification_log enable row level security;

-- Somente leitura para o profissional; quem escreve é o servidor (service role).
create policy "Profissional lê o próprio histórico de notificações"
  on public.notification_log for select
  to authenticated
  using ((select auth.uid()) = professional_id);
