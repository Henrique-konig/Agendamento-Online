\set ON_ERROR_STOP on

begin;

insert into auth.users (id) values ('11111111-1111-4111-8111-111111111111');
insert into public.professionals (id, slug, display_name, profession)
values ('11111111-1111-4111-8111-111111111111', 'ana-nutri', 'Ana', 'Nutricionista');
insert into public.notification_log (professional_id, kind, channel, status)
values ('11111111-1111-4111-8111-111111111111', 'reminder', 'email', 'sent');

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
do $$
begin
  if (select count(*) from public.notification_log) <> 1 then
    raise exception 'profissional não lê o próprio histórico';
  end if;
  begin
    insert into public.notification_log (professional_id, kind, channel, status)
    values ('11111111-1111-4111-8111-111111111111', 'x', 'email', 'sent');
    raise exception 'profissional conseguiu escrever no histórico';
  exception when insufficient_privilege then null;
  end;
end $$;

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
do $$
begin
  if (select count(*) from public.notification_log) <> 0 then
    raise exception 'histórico vazou para outra conta';
  end if;
end $$;

rollback;

\echo 'OK: notificações'
