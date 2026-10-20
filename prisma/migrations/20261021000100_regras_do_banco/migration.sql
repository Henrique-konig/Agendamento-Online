-- Regras de integridade que o Prisma não expressa: sobreposição de horários,
-- validações de formato e gatilhos. Aplicadas logo após a migration inicial.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Validações de formato ------------------------------------------------------------
ALTER TABLE "users"
  ADD CONSTRAINT users_email_lower CHECK (email = lower(email));

ALTER TABLE "professionals"
  ADD CONSTRAINT professionals_slug_format CHECK (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$'),
  ADD CONSTRAINT professionals_display_name_len CHECK (char_length(display_name) BETWEEN 2 AND 80),
  ADD CONSTRAINT professionals_profession_len CHECK (char_length(profession) BETWEEN 2 AND 60),
  ADD CONSTRAINT professionals_bio_len CHECK (char_length(bio) <= 2000),
  ADD CONSTRAINT professionals_whatsapp_fmt CHECK (whatsapp ~ '^[0-9]{10,13}$'),
  ADD CONSTRAINT professionals_instagram_fmt CHECK (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  ADD CONSTRAINT professionals_state_fmt CHECK (state ~ '^[A-Z]{2}$'),
  ADD CONSTRAINT professionals_postal_fmt CHECK (postal_code ~ '^[0-9]{8}$'),
  ADD CONSTRAINT professionals_slot_interval CHECK (slot_interval_minutes BETWEEN 5 AND 240),
  ADD CONSTRAINT professionals_min_notice CHECK (min_notice_minutes BETWEEN 0 AND 20160),
  ADD CONSTRAINT professionals_max_days CHECK (max_days_ahead BETWEEN 1 AND 180),
  ADD CONSTRAINT professionals_buffer CHECK (buffer_minutes BETWEEN 0 AND 240);

ALTER TABLE "services"
  ADD CONSTRAINT services_name_len CHECK (char_length(name) BETWEEN 2 AND 80),
  ADD CONSTRAINT services_duration CHECK (duration_minutes BETWEEN 5 AND 720),
  ADD CONSTRAINT services_price CHECK (price_cents >= 0);

ALTER TABLE "clients"
  ADD CONSTRAINT clients_name_len CHECK (char_length(name) BETWEEN 2 AND 120),
  ADD CONSTRAINT clients_phone_fmt CHECK (phone ~ '^[0-9]{10,13}$');

ALTER TABLE "quote_requests"
  ADD CONSTRAINT quotes_phone_fmt CHECK (phone ~ '^[0-9]{10,13}$'),
  ADD CONSTRAINT quotes_description_len CHECK (char_length(description) BETWEEN 10 AND 3000);

ALTER TABLE "appointments"
  ADD CONSTRAINT appointments_interval CHECK (ends_at > starts_at),
  ADD CONSTRAINT appointments_source CHECK (source IN ('online', 'painel')),
  ADD CONSTRAINT appointments_payment_amount CHECK (payment_amount_cents > 0);

ALTER TABLE "time_off"
  ADD CONSTRAINT time_off_interval CHECK (ends_at > starts_at);

ALTER TABLE "availability_rules"
  ADD CONSTRAINT availability_weekday CHECK (weekday BETWEEN 0 AND 6),
  ADD CONSTRAINT availability_interval CHECK (end_time > start_time);

-- Sem sobreposição --------------------------------------------------------------------
-- Faixas de atendimento do mesmo dia nunca se cruzam.
ALTER TABLE "availability_rules"
  ADD CONSTRAINT availability_no_overlap EXCLUDE USING gist (
    professional_id WITH =,
    weekday WITH =,
    tsrange('2000-01-01'::date + start_time, '2000-01-01'::date + end_time, '[)') WITH &&
  );

-- Dois compromissos ativos nunca se sobrepõem, mesmo em reservas simultâneas.
ALTER TABLE "appointments"
  ADD CONSTRAINT appointments_no_overlap EXCLUDE USING gist (
    professional_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status IN ('pending', 'confirmed'));

-- Índices parciais usados pelas rotinas de lembrete e de expiração do Pix.
CREATE INDEX appointments_reminder_pending_idx
  ON "appointments" (starts_at)
  WHERE reminder_sent_at IS NULL AND status = 'confirmed';

CREATE INDEX appointments_payment_pending_idx
  ON "appointments" (payment_expires_at)
  WHERE payment_status = 'pending';

-- Gatilhos ---------------------------------------------------------------------------------
-- Slugs reservados para não colidir com rotas do app.
CREATE OR REPLACE FUNCTION reject_reserved_slug() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF new.slug = ANY (ARRAY[
    'api', 'painel', 'entrar', 'cadastro', 'sair', 'auth', 'admin',
    'precos', 'termos', 'privacidade', 'ajuda', 'suporte', 'www', 'app'
  ]) THEN
    RAISE EXCEPTION 'slug reservado: %', new.slug USING errcode = '23514';
  END IF;
  RETURN new;
END;
$$;

CREATE TRIGGER professionals_reserved_slug
  BEFORE INSERT OR UPDATE OF slug ON "professionals"
  FOR EACH ROW EXECUTE FUNCTION reject_reserved_slug();

-- Novos profissionais já nascem com expediente: seg–sex, 9h–12h e 13h–18h.
CREATE OR REPLACE FUNCTION seed_default_availability() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "availability_rules" (professional_id, weekday, start_time, end_time)
  SELECT new.id, d, t.s, t.e
  FROM generate_series(1, 5) AS d
  CROSS JOIN (VALUES ('09:00'::time, '12:00'::time), ('13:00'::time, '18:00'::time)) AS t(s, e);
  RETURN new;
END;
$$;

CREATE TRIGGER professionals_seed_availability
  AFTER INSERT ON "professionals"
  FOR EACH ROW EXECUTE FUNCTION seed_default_availability();
