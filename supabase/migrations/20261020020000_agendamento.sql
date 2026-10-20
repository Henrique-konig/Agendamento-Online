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
