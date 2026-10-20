#!/usr/bin/env bash
# Aplica as migrations do Prisma em um banco vazio e roda os testes SQL.
# Uso: DATABASE_URL=postgres://postgres@localhost:5432/postgres scripts/test-db.sh
set -euo pipefail

: "${DATABASE_URL:?Defina DATABASE_URL apontando para um Postgres (será criado um banco temporário)}"
DB_NAME="agenda_test_$$"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ADMIN_URL="$DATABASE_URL"
TEST_URL="${DATABASE_URL%/*}/$DB_NAME"

psql "$ADMIN_URL" -qc "create database $DB_NAME"
trap 'psql "$ADMIN_URL" -qc "drop database if exists $DB_NAME with (force)"' EXIT

run() { psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f "$1"; }

for migration in "$ROOT"/prisma/migrations/*/migration.sql; do
  echo "→ $(basename "$(dirname "$migration")")"
  run "$migration"
done
for test in "$ROOT"/prisma/tests/*.sql; do
  echo "→ $(basename "$test")"
  run "$test"
done
