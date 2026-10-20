-- Agenda Autônomo: todas as migrations em ordem (etapas 0 a 5).
-- Cole no SQL Editor do Supabase e clique em Run. Rode uma única vez.

-- >>> 20261020000000_fundacao.sql
-- =============================================================================
-- Etapa 0 — Fundação
-- Tabela de profissionais (um tenant por usuário autenticado) e utilidades.
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- Atualiza automaticamente a coluna updated_at -------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profissionais ---------------------------------------------------------------
create table public.professionals (
  id            uuid primary key references auth.users (id) on delete cascade,
  slug          citext not null unique
                  check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$'),
  display_name  text not null check (char_length(display_name) between 2 and 80),
  profession    text not null check (char_length(profession) between 2 and 60),
  timezone      text not null default 'America/Sao_Paulo',
  published     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.professionals is
  'Um registro por profissional (tenant). O id é o mesmo de auth.users.';

create trigger professionals_updated_at
  before update on public.professionals
  for each row execute function public.set_updated_at();

-- Slugs reservados para não colidir com rotas do app
create or replace function public.reject_reserved_slug()
returns trigger
language plpgsql
as $$
begin
  if lower(new.slug::text) = any (array[
    'api', 'painel', 'entrar', 'cadastro', 'sair', 'auth', 'admin',
    'precos', 'termos', 'privacidade', 'ajuda', 'suporte', 'www', 'app'
  ]) then
    raise exception 'slug reservado: %', new.slug using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger professionals_reserved_slug
  before insert or update of slug on public.professionals
  for each row execute function public.reject_reserved_slug();

-- RLS -------------------------------------------------------------------------
alter table public.professionals enable row level security;

create policy "Público lê profissionais publicados"
  on public.professionals for select
  using (published = true);

create policy "Profissional lê o próprio registro"
  on public.professionals for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Profissional cria o próprio registro"
  on public.professionals for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Profissional atualiza o próprio registro"
  on public.professionals for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- >>> 20261020010000_pagina_publica.sql
-- =============================================================================
-- Etapa 1 — Página pública
-- Perfil completo, serviços, galeria de fotos e bucket de mídia.
-- =============================================================================

-- Perfil ----------------------------------------------------------------------
alter table public.professionals
  add column bio            text check (char_length(bio) <= 2000),
  add column phone          text check (char_length(phone) <= 20),
  add column whatsapp       text check (whatsapp ~ '^[0-9]{10,13}$'),
  add column contact_email  text check (char_length(contact_email) <= 254),
  add column instagram      text check (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  add column address_line   text check (char_length(address_line) <= 160),
  add column neighborhood   text check (char_length(neighborhood) <= 80),
  add column city           text check (char_length(city) <= 80),
  add column state          char(2) check (state ~ '^[A-Z]{2}$'),
  add column postal_code    text check (postal_code ~ '^[0-9]{8}$'),
  add column service_area   text check (char_length(service_area) <= 160),
  add column show_address   boolean not null default true,
  add column avatar_path    text,
  add column cover_path     text;

comment on column public.professionals.service_area is
  'Para quem atende em domicílio (ex.: "Zona Sul de Porto Alegre").';
comment on column public.professionals.whatsapp is
  'Somente dígitos, com DDI e DDD (ex.: 5551999998888).';

-- Serviços --------------------------------------------------------------------
create table public.services (
  id                uuid primary key default gen_random_uuid(),
  professional_id   uuid not null references public.professionals (id) on delete cascade,
  name              text not null check (char_length(name) between 2 and 80),
  description       text check (char_length(description) <= 500),
  duration_minutes  integer not null default 60 check (duration_minutes between 5 and 720),
  price_cents       integer check (price_cents >= 0),
  price_is_starting boolean not null default false,
  requires_quote    boolean not null default false,
  active            boolean not null default true,
  position          integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on column public.services.price_cents is 'Nulo = "sob consulta".';
comment on column public.services.requires_quote is
  'Serviço exige avaliação: o visitante pede orçamento em vez de agendar.';

create index services_professional_idx on public.services (professional_id, position);

create trigger services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

alter table public.services enable row level security;

create policy "Público lê serviços ativos de profissionais publicados"
  on public.services for select
  using (
    active and exists (
      select 1 from public.professionals p
      where p.id = professional_id and p.published
    )
  );

create policy "Profissional gerencia os próprios serviços"
  on public.services for all
  to authenticated
  using ((select auth.uid()) = professional_id)
  with check ((select auth.uid()) = professional_id);

-- Fotos -----------------------------------------------------------------------
create table public.photos (
  id               uuid primary key default gen_random_uuid(),
  professional_id  uuid not null references public.professionals (id) on delete cascade,
  storage_path     text not null,
  caption          text check (char_length(caption) <= 140),
  position         integer not null default 0,
  created_at       timestamptz not null default now()
);

create index photos_professional_idx on public.photos (professional_id, position);

alter table public.photos enable row level security;

create policy "Público lê fotos de profissionais publicados"
  on public.photos for select
  using (
    exists (
      select 1 from public.professionals p
      where p.id = professional_id and p.published
    )
  );

create policy "Profissional gerencia as próprias fotos"
  on public.photos for all
  to authenticated
  using ((select auth.uid()) = professional_id)
  with check ((select auth.uid()) = professional_id);

-- Storage: bucket público "media", uma pasta por profissional -------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Profissional envia arquivos para a própria pasta"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Profissional altera arquivos da própria pasta"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Profissional remove arquivos da própria pasta"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- >>> 20261020020000_agendamento.sql
-- =============================================================================
-- Etapa 2 — Agendamento, bloqueios, clientes e orçamentos
-- =============================================================================

create extension if not exists "btree_gist";

-- Configurações de agenda do profissional -------------------------------------
alter table public.professionals
  add column booking_enabled       boolean not null default true,
  add column auto_confirm          boolean not null default true,
  add column slot_interval_minutes integer not null default 30
    check (slot_interval_minutes between 5 and 240),
  add column min_notice_minutes    integer not null default 120
    check (min_notice_minutes between 0 and 20160),
  add column max_days_ahead        integer not null default 30
    check (max_days_ahead between 1 and 180),
  add column buffer_minutes        integer not null default 0
    check (buffer_minutes between 0 and 240);

comment on column public.professionals.buffer_minutes is
  'Intervalo livre mantido antes e depois de cada compromisso (deslocamento, limpeza).';

-- Horários de atendimento (hora local do profissional) -------------------------
create table public.availability_rules (
  id               uuid primary key default gen_random_uuid(),
  professional_id  uuid not null references public.professionals (id) on delete cascade,
  weekday          smallint not null check (weekday between 0 and 6), -- 0 = domingo
  start_time       time not null,
  end_time         time not null,
  check (end_time > start_time),
  exclude using gist (
    professional_id with =,
    weekday with =,
    tsrange('2000-01-01'::date + start_time, '2000-01-01'::date + end_time, '[)') with &&
  )
);

create index availability_rules_professional_idx
  on public.availability_rules (professional_id, weekday, start_time);

alter table public.availability_rules enable row level security;

create policy "Profissional gerencia os próprios horários"
  on public.availability_rules for all
  to authenticated
  using ((select auth.uid()) = professional_id)
  with check ((select auth.uid()) = professional_id);

-- Bloqueios (folgas, férias, compromissos pessoais) ----------------------------
create table public.time_off (
  id               uuid primary key default gen_random_uuid(),
  professional_id  uuid not null references public.professionals (id) on delete cascade,
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  reason           text check (char_length(reason) <= 140),
  created_at       timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index time_off_professional_idx on public.time_off (professional_id, ends_at);

alter table public.time_off enable row level security;

create policy "Profissional gerencia os próprios bloqueios"
  on public.time_off for all
  to authenticated
  using ((select auth.uid()) = professional_id)
  with check ((select auth.uid()) = professional_id);

-- Clientes ----------------------------------------------------------------------
create table public.clients (
  id               uuid primary key default gen_random_uuid(),
  professional_id  uuid not null references public.professionals (id) on delete cascade,
  name             text not null check (char_length(name) between 2 and 120),
  phone            text not null check (phone ~ '^[0-9]{10,13}$'),
  email            text check (char_length(email) <= 254),
  notes            text check (char_length(notes) <= 2000),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (professional_id, phone)
);

create trigger clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

alter table public.clients enable row level security;

create policy "Profissional gerencia os próprios clientes"
  on public.clients for all
  to authenticated
  using ((select auth.uid()) = professional_id)
  with check ((select auth.uid()) = professional_id);

-- Agendamentos -------------------------------------------------------------------
create type public.appointment_status as enum (
  'pending', 'confirmed', 'cancelled', 'completed', 'no_show'
);

create table public.appointments (
  id               uuid primary key default gen_random_uuid(),
  professional_id  uuid not null references public.professionals (id) on delete cascade,
  client_id        uuid not null references public.clients (id) on delete cascade,
  service_id       uuid references public.services (id) on delete set null,
  service_name     text not null,
  price_cents      integer check (price_cents >= 0),
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  status           public.appointment_status not null default 'confirmed',
  notes            text check (char_length(notes) <= 1000),
  source           text not null default 'online' check (source in ('online', 'painel')),
  cancel_token     uuid not null default gen_random_uuid() unique,
  cancelled_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (ends_at > starts_at),
  -- Impede dois compromissos ativos sobrepostos, mesmo em requisições simultâneas.
  constraint appointments_no_overlap exclude using gist (
    professional_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'confirmed'))
);

comment on column public.appointments.service_name is
  'Cópia do nome do serviço no momento do agendamento.';
comment on column public.appointments.cancel_token is
  'Token secreto do link de cancelamento enviado ao cliente.';

create index appointments_professional_starts_idx
  on public.appointments (professional_id, starts_at);
create index appointments_client_idx on public.appointments (client_id, starts_at desc);

create trigger appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

alter table public.appointments enable row level security;

create policy "Profissional gerencia os próprios agendamentos"
  on public.appointments for all
  to authenticated
  using ((select auth.uid()) = professional_id)
  with check ((select auth.uid()) = professional_id);

-- Pedidos de orçamento -------------------------------------------------------------
create type public.quote_status as enum ('new', 'contacted', 'scheduled', 'closed');

create table public.quote_requests (
  id                uuid primary key default gen_random_uuid(),
  professional_id   uuid not null references public.professionals (id) on delete cascade,
  client_id         uuid references public.clients (id) on delete set null,
  service_id        uuid references public.services (id) on delete set null,
  service_name      text,
  name              text not null check (char_length(name) between 2 and 120),
  phone             text not null check (phone ~ '^[0-9]{10,13}$'),
  email             text check (char_length(email) <= 254),
  description       text not null check (char_length(description) between 10 and 3000),
  location          text check (char_length(location) <= 200),
  preferred_period  text check (char_length(preferred_period) <= 60),
  status            public.quote_status not null default 'new',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index quote_requests_professional_idx
  on public.quote_requests (professional_id, created_at desc);

create trigger quote_requests_updated_at
  before update on public.quote_requests
  for each row execute function public.set_updated_at();

alter table public.quote_requests enable row level security;

create policy "Profissional gerencia os próprios orçamentos"
  on public.quote_requests for all
  to authenticated
  using ((select auth.uid()) = professional_id)
  with check ((select auth.uid()) = professional_id);

-- Horários padrão para novos profissionais: seg–sex 9h–12h e 13h–18h -------------
create or replace function public.seed_default_availability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.availability_rules (professional_id, weekday, start_time, end_time)
  select new.id, d, t.s, t.e
  from generate_series(1, 5) as d
  cross join (values ('09:00'::time, '12:00'::time), ('13:00'::time, '18:00'::time)) as t(s, e);
  return new;
end;
$$;

create trigger professionals_seed_availability
  after insert on public.professionals
  for each row execute function public.seed_default_availability();

-- Substitui todos os horários do profissional logado em uma única transação ------
create or replace function public.replace_availability(rules jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.availability_rules where professional_id = auth.uid();
  insert into public.availability_rules (professional_id, weekday, start_time, end_time)
  select auth.uid(), (r->>'weekday')::smallint, (r->>'start_time')::time, (r->>'end_time')::time
  from jsonb_array_elements(rules) as r;
end;
$$;

revoke execute on function public.replace_availability(jsonb) from public, anon;
grant execute on function public.replace_availability(jsonb) to authenticated;

-- >>> 20261020030000_lembretes.sql
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

-- >>> 20261020040000_google_agenda.sql
-- =============================================================================
-- Etapa 4 — Integração com Google Agenda
-- =============================================================================

create table public.google_connections (
  professional_id          uuid primary key references public.professionals (id) on delete cascade,
  google_email             text,
  calendar_id              text not null default 'primary',
  -- Tokens criptografados pela aplicação (AES-256-GCM, GOOGLE_TOKEN_ENCRYPTION_KEY).
  refresh_token_enc        text not null,
  access_token_enc         text,
  access_token_expires_at  timestamptz,
  sync_busy                boolean not null default true,
  create_events            boolean not null default true,
  last_error               text,
  last_error_at            timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table public.google_connections is
  'Credenciais OAuth do Google por profissional. Acesso apenas pelo servidor (service role).';

create trigger google_connections_updated_at
  before update on public.google_connections
  for each row execute function public.set_updated_at();

-- RLS habilitado sem políticas: nenhum acesso pelas chaves anon/authenticated.
alter table public.google_connections enable row level security;
revoke all on public.google_connections from anon, authenticated;

alter table public.appointments
  add column google_event_id text;

-- >>> 20261020050000_pix.sql
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
