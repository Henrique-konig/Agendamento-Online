#!/usr/bin/env bash
# Aplica todas as migrations em um banco Postgres vazio e roda os testes SQL.
# Uso: DATABASE_URL=postgres://postgres@localhost:5432/postgres scripts/test-db.sh
set -euo pipefail

: "${DATABASE_URL:?Defina DATABASE_URL apontando para um Postgres vazio}"
DB_NAME="agenda_test_$$"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ADMIN_URL="$DATABASE_URL"
TEST_URL="${DATABASE_URL%/*}/$DB_NAME"

psql "$ADMIN_URL" -qc "create database $DB_NAME"
trap 'psql "$ADMIN_URL" -qc "drop database if exists $DB_NAME with (force)"' EXIT

run() { psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f "$1"; }

run "$ROOT/supabase/tests/00_supabase_stubs.sql"
for migration in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ $(basename "$migration")"
  run "$migration"
done
for test in "$ROOT"/supabase/tests/[1-9]*.sql; do
  echo "→ $(basename "$test")"
  run "$test"
done
