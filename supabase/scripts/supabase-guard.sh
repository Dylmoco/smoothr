#!/usr/bin/env bash
set -euo pipefail

SUPABASE_DIR="supabase"
MIGRATIONS_DIR="$SUPABASE_DIR/migrations"
ENVIRONMENT="${ENVIRONMENT:-production}"

warn=0
block=0
messages=()

# 1. Fail if any SQL files exist outside migrations/ (excluding docs/)
stray=()
while IFS= read -r -d '' file; do
  stray+=("${file#$SUPABASE_DIR/}")
done < <(find "$SUPABASE_DIR" -type f -name '*.sql' ! -path "$MIGRATIONS_DIR/*" ! -path "$SUPABASE_DIR/docs/*" -print0)
if [ ${#stray[@]} -gt 0 ]; then
  block=1
  messages+=("SQL files outside migrations: ${stray[*]}")
fi

# 2. Ensure migration numbering is sequential
if [ -d "$MIGRATIONS_DIR" ]; then
  mapfile -t numbers < <(find "$MIGRATIONS_DIR" -type f -name '*.sql' -exec basename {} \; |
    sed -E 's/^([0-9]+)_.*$/\1/' | sort)
  if [ ${#numbers[@]} -gt 0 ]; then
    expected=${numbers[0]}
    for num in "${numbers[@]}"; do
      if [ "$num" != "$expected" ]; then
        block=1
        messages+=("Migration numbering error: expected $expected but found $num")
        break
      fi
      expected=$(printf "%0${#num}d" $((10#$num + 1)))
    done
  fi
fi

# 3. Scan migrations for destructive SQL and GRANT/REVOKE order
if [ -d "$MIGRATIONS_DIR" ]; then
  while IFS= read -r -d '' file; do
    seen_revoke=0
    warned_grant=0
    while IFS= read -r line; do
      upper=$(echo "$line" | tr '[:lower:]' '[:upper:]')
      if [[ "$upper" =~ DROP[[:space:]]+TABLE ]] && [[ ! "$upper" =~ IF[[:space:]]+EXISTS ]]; then
        if [ "$ENVIRONMENT" = "production" ]; then
          block=1
          messages+=("DROP TABLE without IF EXISTS in $file")
        else
          warn=1
          messages+=("Warning: DROP TABLE without IF EXISTS in $file")
        fi
      fi
      if [[ "$upper" =~ ALTER[[:space:]]+TABLE ]] && [[ "$upper" =~ DROP[[:space:]]+COLUMN ]] && [[ ! "$upper" =~ DROP[[:space:]]+COLUMN[[:space:]]+IF[[:space:]]+EXISTS ]]; then
        if [ "$ENVIRONMENT" = "production" ]; then
          block=1
          messages+=("ALTER TABLE DROP COLUMN without IF EXISTS in $file")
        else
          warn=1
          messages+=("Warning: ALTER TABLE DROP COLUMN without IF EXISTS in $file")
        fi
      fi
      if [[ "$upper" =~ REVOKE ]]; then
        seen_revoke=1
      fi
      if [[ "$upper" =~ GRANT ]] && [ $seen_revoke -eq 0 ] && [ $warned_grant -eq 0 ]; then
        warn=1
        messages+=("GRANT without preceding REVOKE in $file")
        warned_grant=1
      fi
    done < "$file"
  done < <(find "$MIGRATIONS_DIR" -type f -name '*.sql' -print0)
fi

# 4. After supabase db push, run supabase db diff to detect drift
if command -v supabase >/dev/null 2>&1; then
  supabase db push >/dev/null
  diff_output=$(supabase db diff 2>&1)
  if [ -n "$(echo "$diff_output" | tr -d '[:space:]')" ]; then
    block=1
    messages+=("Database drift detected. Run 'supabase migration repair' and 'supabase db pull'.")
  fi
else
  warn=1
  messages+=("supabase CLI not found; skipping drift check")
fi

for m in "${messages[@]}"; do
  echo "$m"
done

if [ $block -eq 1 ]; then
  echo "supabase-guard: BLOCK"
  exit 2
elif [ $warn -eq 1 ]; then
  echo "supabase-guard: WARN"
  exit 1
else
  echo "supabase-guard: OK"
  exit 0
fi
