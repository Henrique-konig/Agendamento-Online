\set ON_ERROR_STOP on

begin;

insert into auth.users (id) values ('11111111-1111-4111-8111-111111111111');
insert into public.professionals (id, slug, display_name, profession)
values ('11111111-1111-4111-8111-111111111111', 'ana-nutri', 'Ana', 'Nutricionista');
insert into public.google_connections (professional_id, refresh_token_enc)
values ('11111111-1111-4111-8111-111111111111', 'v1.x.y.z');

-- Nem o próprio profissional lê os tokens pela API pública: só o servidor.
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
do $$
begin
  begin
    perform 1 from public.google_connections;
    raise exception 'authenticated conseguiu ler google_connections';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
set local role service_role;
do $$
begin
  if (select count(*) from public.google_connections) <> 1 then
    raise exception 'service_role não lê google_connections';
  end if;
end $$;

rollback;

\echo 'OK: google'
