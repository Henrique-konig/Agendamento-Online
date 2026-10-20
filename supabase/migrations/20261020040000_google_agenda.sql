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
