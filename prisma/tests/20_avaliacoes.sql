-- Regras das avaliações: nota 1–5, uma por agendamento, cascata.
\set ON_ERROR_STOP on

begin;

insert into users (id, email, password_hash)
values ('11111111-1111-4111-8111-111111111111', 'ana@example.com', 'x');
insert into professionals (id, slug, display_name, profession, published)
values ('11111111-1111-4111-8111-111111111111', 'ana-nutri', 'Ana', 'Nutricionista', true);
insert into clients (id, professional_id, name, phone)
values ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111',
        'Maria', '5551988887777');
insert into appointments (id, professional_id, client_id, service_name, starts_at, ends_at)
values ('55555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111',
        '44444444-4444-4444-8444-444444444444', 'Consulta',
        '2026-11-02 12:00+00', '2026-11-02 13:00+00');

do $$
begin
  -- Nota fora de 1–5 é recusada
  begin
    insert into reviews (professional_id, appointment_id, client_id, rating)
    values ('11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555',
            '44444444-4444-4444-8444-444444444444', 6);
    raise exception 'nota 6 aceita';
  exception when check_violation then null;
  end;
  begin
    insert into reviews (professional_id, appointment_id, client_id, rating)
    values ('11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555',
            '44444444-4444-4444-8444-444444444444', 0);
    raise exception 'nota 0 aceita';
  exception when check_violation then null;
  end;

  -- Comentário muito longo é recusado
  begin
    insert into reviews (professional_id, appointment_id, client_id, rating, comment)
    values ('11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555',
            '44444444-4444-4444-8444-444444444444', 5, repeat('a', 1001));
    raise exception 'comentário gigante aceito';
  exception when check_violation then null;
  end;

  insert into reviews (professional_id, appointment_id, client_id, rating, comment)
  values ('11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555',
          '44444444-4444-4444-8444-444444444444', 5, 'Ótimo atendimento');

  -- Só uma avaliação por agendamento
  begin
    insert into reviews (professional_id, appointment_id, client_id, rating)
    values ('11111111-1111-4111-8111-111111111111', '55555555-5555-4555-8555-555555555555',
            '44444444-4444-4444-8444-444444444444', 4);
    raise exception 'segunda avaliação do mesmo agendamento aceita';
  exception when unique_violation then null;
  end;

  -- Padrões: visível, e o profissional pede avaliações por padrão
  if (select hidden from reviews) then raise exception 'avaliação nasceu oculta'; end if;
  if not (select ask_reviews from professionals) then raise exception 'ask_reviews deveria ser true'; end if;

  -- Apagar o agendamento leva a avaliação junto
  delete from appointments where id = '55555555-5555-4555-8555-555555555555';
  if (select count(*) from reviews) <> 0 then raise exception 'cascata não removeu a avaliação'; end if;
end $$;

rollback;

\echo 'OK: avaliações'
