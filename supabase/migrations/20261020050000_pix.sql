-- =============================================================================
-- Etapa 5 — Pagamento antecipado via Pix (opcional)
-- =============================================================================

create type public.pix_mode as enum ('manual', 'mercadopago');
create type public.payment_status as enum (
  'not_required', 'pending', 'paid', 'expired', 'refunded'
);

-- Configuração de Pix por profissional ------------------------------------------
create table public.pix_settings (
  professional_id          uuid primary key references public.professionals (id) on delete cascade,
  enabled                  boolean not null default false,
  mode                     public.pix_mode not null default 'manual',
  -- Modo manual: BR Code estático gerado a partir da chave Pix.
  pix_key                  text check (char_length(pix_key) <= 77),
  merchant_name            text check (char_length(merchant_name) <= 25),
  merchant_city            text check (char_length(merchant_city) <= 15),
  -- Modo Mercado Pago: token de acesso criptografado pela aplicação.
  mp_access_token_enc      text,
  deposit_percent          integer not null default 100 check (deposit_percent between 1 and 100),
  hold_minutes             integer not null default 30 check (hold_minutes between 10 and 1440),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on column public.pix_settings.hold_minutes is
  'Tempo que o horário fica reservado aguardando o pagamento.';

create trigger pix_settings_updated_at
  before update on public.pix_settings
  for each row execute function public.set_updated_at();

-- Contém credencial: acesso somente pelo servidor.
alter table public.pix_settings enable row level security;
revoke all on public.pix_settings from anon, authenticated;

-- Serviço pode exigir pagamento antecipado ---------------------------------------
alter table public.services
  add column requires_prepayment boolean not null default false;

-- Pagamento do agendamento ---------------------------------------------------------
alter table public.appointments
  add column payment_status       public.payment_status not null default 'not_required',
  add column payment_amount_cents integer check (payment_amount_cents > 0),
  add column payment_provider     public.pix_mode,
  add column payment_provider_id  text,
  add column payment_expires_at   timestamptz,
  add column pix_copy_paste       text,
  add column paid_at              timestamptz;

create unique index appointments_payment_provider_idx
  on public.appointments (payment_provider, payment_provider_id)
  where payment_provider_id is not null;

create index appointments_payment_pending_idx
  on public.appointments (payment_expires_at)
  where payment_status = 'pending';

-- Libera horários cujo pagamento não chegou a tempo ------------------------------
create or replace function public.expire_unpaid_appointments(p_professional_id uuid default null)
returns setof uuid
language sql
security definer
set search_path = public
as $$
  update public.appointments
     set status = 'cancelled',
         payment_status = 'expired',
         cancelled_at = now()
   where payment_status = 'pending'
     and status = 'pending'
     and payment_expires_at < now()
     and (p_professional_id is null or professional_id = p_professional_id)
  returning id;
$$;

revoke execute on function public.expire_unpaid_appointments(uuid) from public, anon, authenticated;
grant execute on function public.expire_unpaid_appointments(uuid) to service_role;
