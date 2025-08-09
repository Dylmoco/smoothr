#!/usr/bin/env bash
set -euo pipefail

SUPABASE_DIR="supabase"
MIGRATIONS_DIR="$SUPABASE_DIR/migrations"
ENVIRONMENT="${ENVIRONMENT:-production}"

warn=0
block=0
messages=()

# 1. Verify every supabase/*.sql file is referenced by a migration
unreferenced=()
if compgen -G "$SUPABASE_DIR/*.sql" > /dev/null; then
  for sql_file in $SUPABASE_DIR/*.sql; do
    base=$(basename "$sql_file")
    if [ -d "$MIGRATIONS_DIR" ] && \
       find "$MIGRATIONS_DIR" -type f -name '*.sql' -exec grep -Fq "$base" {} +; then
      continue
    else
      unreferenced+=("$base")
    fi
  done
fi
if [ ${#unreferenced[@]} -gt 0 ]; then
  block=1
  messages+=("Unreferenced SQL files: ${unreferenced[*]}")
fi

# 2. Ensure migration numbering is sequential
if [ -d "$MIGRATIONS_DIR" ]; then
  mapfile -t numbers < <(find "$MIGRATIONS_DIR" -type f -name '*.sql' -exec basename {} \; | \
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

# 3. Scan migrations for destructive SQL
if [ -d "$MIGRATIONS_DIR" ]; then
  while IFS= read -r -d '' file; do
    if grep -Eiq '\bDROP TABLE\b|\bALTER\b' "$file"; then
      if ! grep -Eiq 'IF EXISTS|IF NOT EXISTS' "$file"; then
        if [ "$ENVIRONMENT" = "production" ]; then
          block=1
          messages+=("Unsafe destructive SQL in $file")
        else
          warn=1
          messages+=("Warning: unsafe destructive SQL in $file")
        fi
      fi
    fi
  done < <(find "$MIGRATIONS_DIR" -type f -name '*.sql' -print0)
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
