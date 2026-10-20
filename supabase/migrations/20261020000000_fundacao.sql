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
