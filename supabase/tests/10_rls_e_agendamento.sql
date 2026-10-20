-- Testes de integração das migrations: RLS e regras de agendamento.
-- Executado por scripts/test-db.sh. Qualquer falha aborta com erro.
\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'ana@example.com'),
  ('22222222-2222-4222-8222-222222222222', 'bia@example.com');

-- Profissional cria o próprio registro ------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
insert into public.professionals (id, slug, display_name, profession, published)
values ('11111111-1111-4111-8111-111111111111', 'ana-nutri', 'Ana', 'Nutricionista', true);

do $$
begin
  -- Horários padrão criados pelo trigger (seg–sex, 2 faixas)
  if (select count(*) from public.availability_rules) <> 10 then
    raise exception 'esperava 10 faixas padrão';
  end if;

  -- Não pode criar registro para outro usuário
  begin
    insert into public.professionals (id, slug, display_name, profession)
    values ('22222222-2222-4222-8222-222222222222', 'intrusa', 'X', 'Teste');
    raise exception 'RLS permitiu inserir profissional de outro usuário';
  exception when insufficient_privilege then null;
  end;

  -- Slug reservado
  begin
    update public.professionals set slug = 'painel';
    raise exception 'slug reservado foi aceito';
  exception when check_violation then null;
  end;
end $$;

insert into public.services (id, professional_id, name, duration_minutes, price_cents)
values ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111',
        'Consulta', 60, 20000);

-- replace_availability substitui tudo de forma atômica
select public.replace_availability('[{"weekday":1,"start_time":"08:00","end_time":"12:00"}]');
do $$
begin
  if (select count(*) from public.availability_rules) <> 1 then
    raise exception 'replace_availability não substituiu as faixas';
  end if;
end $$;

-- Faixas sobrepostas são rejeitadas pelo banco
do $$
begin
  begin
    perform public.replace_availability(
      '[{"weekday":2,"start_time":"08:00","end_time":"12:00"},
        {"weekday":2,"start_time":"11:00","end_time":"13:00"}]');
    raise exception 'faixas sobrepostas aceitas';
  exception when exclusion_violation then null;
  end;
end $$;

-- Visitante (service role via servidor) cria cliente e agendamento ----------------
reset role;
set local role service_role;
insert into public.clients (id, professional_id, name, phone)
values ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111',
        'Maria', '5551988887777');
insert into public.appointments (professional_id, client_id, service_id, service_name,
                                 starts_at, ends_at)
values ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444',
        '33333333-3333-4333-8333-333333333333', 'Consulta',
        '2026-11-02 12:00+00', '2026-11-02 13:00+00');

do $$
begin
  -- Sobreposição com compromisso ativo é bloqueada
  begin
    insert into public.appointments (professional_id, client_id, service_name, starts_at, ends_at)
    values ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444',
            'Consulta', '2026-11-02 12:30+00', '2026-11-02 13:30+00');
    raise exception 'agendamento sobreposto aceito';
  exception when exclusion_violation then null;
  end;

  -- Encostado (fim = início) é permitido
  insert into public.appointments (professional_id, client_id, service_name, starts_at, ends_at)
  values ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444',
          'Consulta', '2026-11-02 13:00+00', '2026-11-02 14:00+00');

  -- Cancelado libera o horário
  update public.appointments set status = 'cancelled' where starts_at = '2026-11-02 13:00+00';
  insert into public.appointments (professional_id, client_id, service_name, starts_at, ends_at)
  values ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444',
          'Consulta', '2026-11-02 13:00+00', '2026-11-02 14:00+00');
end $$;

-- Visitante anônimo não lê dados privados ------------------------------------------
reset role;
set local role anon;
set local request.jwt.claim.sub = '';
do $$
begin
  if (select count(*) from public.appointments) <> 0 then raise exception 'anon leu agendamentos'; end if;
  if (select count(*) from public.clients) <> 0 then raise exception 'anon leu clientes'; end if;
  if (select count(*) from public.professionals) <> 1 then raise exception 'anon não vê perfil publicado'; end if;
  if (select count(*) from public.services) <> 1 then raise exception 'anon não vê serviços'; end if;
  begin
    perform public.replace_availability('[]');
    raise exception 'anon executou replace_availability';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Outra profissional não enxerga dados da primeira -----------------------------------
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
do $$
begin
  if (select count(*) from public.appointments) <> 0 then raise exception 'vazamento de agendamentos'; end if;
  if (select count(*) from public.clients) <> 0 then raise exception 'vazamento de clientes'; end if;
  if (select count(*) from public.availability_rules) <> 0 then raise exception 'vazamento de horários'; end if;
  update public.services set name = 'Hack';
  if exists (select 1 from public.services where name = 'Hack') then raise exception 'alterou serviço alheio'; end if;
end $$;

reset role;
do $$
begin
  if exists (select 1 from public.services where name = 'Hack') then
    raise exception 'alterou serviço alheio';
  end if;
end $$;

rollback;

\echo 'OK: RLS e agendamento'
