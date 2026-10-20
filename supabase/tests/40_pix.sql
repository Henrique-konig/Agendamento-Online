\set ON_ERROR_STOP on

begin;

insert into auth.users (id) values ('11111111-1111-4111-8111-111111111111');
insert into public.professionals (id, slug, display_name, profession, published)
values ('11111111-1111-4111-8111-111111111111', 'ana-nutri', 'Ana', 'Nutricionista', true);
insert into public.pix_settings (professional_id, enabled, mp_access_token_enc)
values ('11111111-1111-4111-8111-111111111111', true, 'v1.a.b.c');
insert into public.clients (id, professional_id, name, phone)
values ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111',
        'Maria', '5551988887777');

-- Uma reserva com Pix vencido e outra ainda dentro do prazo
insert into public.appointments (id, professional_id, client_id, service_name, starts_at, ends_at,
                                 status, payment_status, payment_expires_at)
values
  ('55555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111',
   '44444444-4444-4444-8444-444444444444', 'Consulta',
   '2026-11-02 12:00+00', '2026-11-02 13:00+00', 'pending', 'pending', now() - interval '1 minute'),
  ('66666666-6666-4666-8666-666666666666', '11111111-1111-4111-8111-111111111111',
   '44444444-4444-4444-8444-444444444444', 'Consulta',
   '2026-11-02 14:00+00', '2026-11-02 15:00+00', 'pending', 'pending', now() + interval '20 minutes');

-- Público e profissional não acessam as credenciais nem a função de expiração
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
do $$
begin
  begin
    perform 1 from public.pix_settings;
    raise exception 'authenticated leu pix_settings';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.expire_unpaid_appointments(null);
    raise exception 'authenticated executou expire_unpaid_appointments';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
set local role service_role;
do $$
declare
  expired uuid[];
begin
  select array_agg(e) into expired
    from public.expire_unpaid_appointments('11111111-1111-4111-8111-111111111111') as e;
  if expired is distinct from array['55555555-5555-4555-8555-555555555555'::uuid] then
    raise exception 'expiração incorreta: %', expired;
  end if;
  if (select status from public.appointments where id = '55555555-5555-4555-8555-555555555555') <> 'cancelled' then
    raise exception 'reserva vencida não foi cancelada';
  end if;
  if (select payment_status from public.appointments where id = '66666666-6666-4666-8666-666666666666') <> 'pending' then
    raise exception 'reserva no prazo foi alterada';
  end if;

  -- O horário liberado aceita nova reserva
  insert into public.appointments (professional_id, client_id, service_name, starts_at, ends_at)
  values ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444',
          'Consulta', '2026-11-02 12:00+00', '2026-11-02 13:00+00');
end $$;

rollback;

\echo 'OK: pix'
