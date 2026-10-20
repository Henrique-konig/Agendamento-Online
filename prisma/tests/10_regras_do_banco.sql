-- Testes de integração das migrations: regras que ficam no banco (e não no app).
-- Executado por scripts/test-db.sh. Qualquer falha aborta com erro.
\set ON_ERROR_STOP on

begin;

insert into users (id, email, password_hash) values
  ('11111111-1111-4111-8111-111111111111', 'ana@example.com', 'x'),
  ('22222222-2222-4222-8222-222222222222', 'bia@example.com', 'x');

insert into professionals (id, slug, display_name, profession, published)
values ('11111111-1111-4111-8111-111111111111', 'ana-nutri', 'Ana', 'Nutricionista', true);

do $$
begin
  -- Gatilho cria o expediente padrão (seg–sex, 2 faixas)
  if (select count(*) from availability_rules) <> 10 then
    raise exception 'esperava 10 faixas padrão, vieram %', (select count(*) from availability_rules);
  end if;

  -- E-mail precisa estar em minúsculas
  begin
    insert into users (email, password_hash) values ('Maiuscula@Example.com', 'x');
    raise exception 'e-mail com maiúsculas aceito';
  exception when check_violation then null;
  end;

  -- Slug reservado e slug fora do formato
  begin
    insert into professionals (id, slug, display_name, profession)
    values ('22222222-2222-4222-8222-222222222222', 'painel', 'Bia', 'Teste');
    raise exception 'slug reservado aceito';
  exception when check_violation then null;
  end;
  begin
    insert into professionals (id, slug, display_name, profession)
    values ('22222222-2222-4222-8222-222222222222', 'Bia-Maiuscula', 'Bia', 'Teste');
    raise exception 'slug com maiúsculas aceito';
  exception when check_violation then null;
  end;

  -- Slug único
  begin
    insert into professionals (id, slug, display_name, profession)
    values ('22222222-2222-4222-8222-222222222222', 'ana-nutri', 'Bia', 'Teste');
    raise exception 'slug duplicado aceito';
  exception when unique_violation then null;
  end;

  -- Faixas de atendimento sobrepostas no mesmo dia são rejeitadas
  begin
    insert into availability_rules (professional_id, weekday, start_time, end_time)
    values ('11111111-1111-4111-8111-111111111111', 1, '11:00', '14:00');
    raise exception 'faixas sobrepostas aceitas';
  exception when exclusion_violation then null;
  end;
end $$;

insert into clients (id, professional_id, name, phone)
values ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111',
        'Maria', '5551988887777');

do $$
begin
  -- Telefone único por profissional
  begin
    insert into clients (professional_id, name, phone)
    values ('11111111-1111-4111-8111-111111111111', 'Outra', '5551988887777');
    raise exception 'telefone duplicado aceito';
  exception when unique_violation then null;
  end;

  insert into appointments (professional_id, client_id, service_name, starts_at, ends_at)
  values ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444',
          'Consulta', '2026-11-02 12:00+00', '2026-11-02 13:00+00');

  -- Sobreposição com compromisso ativo é bloqueada
  begin
    insert into appointments (professional_id, client_id, service_name, starts_at, ends_at)
    values ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444',
            'Consulta', '2026-11-02 12:30+00', '2026-11-02 13:30+00');
    raise exception 'agendamento sobreposto aceito';
  exception when exclusion_violation then null;
  end;

  -- Encostado (fim = início) é permitido
  insert into appointments (professional_id, client_id, service_name, starts_at, ends_at)
  values ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444',
          'Consulta', '2026-11-02 13:00+00', '2026-11-02 14:00+00');

  -- Cancelado libera o horário
  update appointments set status = 'cancelled' where starts_at = '2026-11-02 13:00+00';
  insert into appointments (professional_id, client_id, service_name, starts_at, ends_at)
  values ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444',
          'Consulta', '2026-11-02 13:00+00', '2026-11-02 14:00+00');

  -- Intervalo invertido é rejeitado
  begin
    insert into appointments (professional_id, client_id, service_name, starts_at, ends_at)
    values ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444',
            'Consulta', '2026-11-03 14:00+00', '2026-11-03 13:00+00');
    raise exception 'intervalo invertido aceito';
  exception when check_violation then null;
  end;
end $$;

-- Apagar o usuário remove tudo o que é dele (cascata)
delete from users where id = '11111111-1111-4111-8111-111111111111';
do $$
begin
  if (select count(*) from professionals) <> 0
     or (select count(*) from appointments) <> 0
     or (select count(*) from clients) <> 0
     or (select count(*) from availability_rules) <> 0 then
    raise exception 'cascata não removeu os dados do usuário';
  end if;
end $$;

rollback;

\echo 'OK: regras do banco'
