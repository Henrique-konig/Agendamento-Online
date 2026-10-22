-- Regras de push_subscriptions: endpoint https e único, cascata ao apagar o profissional.
\set ON_ERROR_STOP on

begin;

insert into users (id, email, password_hash)
values ('11111111-1111-4111-8111-111111111111', 'ana@example.com', 'x');
insert into professionals (id, slug, display_name, profession)
values ('11111111-1111-4111-8111-111111111111', 'ana-nutri', 'Ana', 'Nutricionista');

do $$
begin
  begin
    insert into push_subscriptions (professional_id, endpoint, p256dh, auth)
    values ('11111111-1111-4111-8111-111111111111', 'http://push.example/x', 'k', 'a');
    raise exception 'endpoint http aceito';
  exception when check_violation then null;
  end;

  insert into push_subscriptions (professional_id, endpoint, p256dh, auth)
  values ('11111111-1111-4111-8111-111111111111', 'https://fcm.googleapis.com/fcm/send/1', 'k', 'a');

  begin
    insert into push_subscriptions (professional_id, endpoint, p256dh, auth)
    values ('11111111-1111-4111-8111-111111111111', 'https://fcm.googleapis.com/fcm/send/1', 'k2', 'a2');
    raise exception 'endpoint duplicado aceito';
  exception when unique_violation then null;
  end;

  delete from professionals where id = '11111111-1111-4111-8111-111111111111';
  if (select count(*) from push_subscriptions) <> 0 then
    raise exception 'cascata não removeu as inscrições';
  end if;
end $$;

rollback;

\echo 'OK: push'
