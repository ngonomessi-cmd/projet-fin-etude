#!/usr/bin/env bash
# Rejoue toutes les migrations sur une base PostgreSQL 16 locale neuve (port 5499).
# Usage : bash platform/supabase/tests/rejouer.sh
set -euo pipefail
ICI="$(cd "$(dirname "$0")" && pwd)"
RACINE=/var/tmp/pgged
BIN=/usr/lib/postgresql/16/bin
if [ ! -d "$RACINE/data" ]; then
  mkdir -p "$RACINE" && chown postgres "$RACINE"
  runuser -u postgres -- "$BIN/initdb" -D "$RACINE/data" -A trust -U postgres >/dev/null
fi
if ! pg_isready -q -h "$RACINE" -p 5499; then
  rm -f "$RACINE/.s.PGSQL.5499" "$RACINE/.s.PGSQL.5499.lock" "$RACINE/data/postmaster.pid"
  runuser -u postgres -- "$BIN/pg_ctl" -D "$RACINE/data" -o "-k $RACINE -p 5499" -l "$RACINE/log" start >/dev/null
  sleep 2
fi
P="psql -h $RACINE -p 5499 -U postgres -q -v ON_ERROR_STOP=1"
$P -d postgres -c "drop database if exists ged" -c "create database ged" >/dev/null
$P -d postgres -c "do \$\$ begin if exists (select 1 from pg_roles where rolname='anon') then drop owned by anon, authenticated, service_role, authenticator cascade; drop role anon, authenticated, service_role, authenticator; end if; end \$\$" -d ged >/dev/null 2>&1 || true
$P -d ged -f "$ICI/shim.sql" >/dev/null 2>&1
for f in "$ICI"/../migrations/0*.sql; do
  case "$(basename "$f")" in
    0016_*) $P -d ged -f "$ICI/comptes_test.sql" >/dev/null ;;
    0022_*) $P -d ged -f "$ICI/comptes_test_api.sql" >/dev/null ;;
  esac
  sortie=$($P -d ged -f "$f" 2>&1 | grep -v "NOTICE\|WARNING\|HINT\|DETAIL" || true)
  if echo "$sortie" | grep -q "ERROR"; then echo "ÉCHEC : $(basename "$f")"; echo "$sortie" | head -8; exit 1; fi
done
echo "MIGRATIONS_OK ($(ls "$ICI"/../migrations/0*.sql | wc -l) fichiers)"
