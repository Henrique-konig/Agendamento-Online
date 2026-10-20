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
