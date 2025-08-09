#!/usr/bin/env bash
set -euo pipefail

# Prereqs:
# - Supabase CLI installed (supabase --version)
# - Logged in (supabase login)
# - jq installed (jq --version)
# - Run from repo root

PROJECT_REF="lpuqrzvokroazwlricgn"
BRANCH="chore/supabase-fresh-baseline"
STAMP="$(date +%Y%m%d)"

# Preflight checks
for cmd in supabase jq git; do
  command -v "$cmd" >/dev/null || { echo "Missing $cmd. Install it and rerun."; exit 1; }
done
supabase --version >/dev/null
supabase projects list >/dev/null || { echo "Not logged in. Run: supabase login"; exit 1; }

echo "==> Using project ref: $PROJECT_REF"

# Create/checkout branch
git rev-parse --git-dir >/dev/null 2>&1 || { echo "Not a git repo. Init git and rerun."; exit 1; }
git checkout -b "$BRANCH" 2>/dev/null || git checkout "$BRANCH"

# Archive old migrations
mkdir -p "supabase/_archive_migrations_${STAMP}"
if [ -d supabase/migrations ] && [ "$(ls -A supabase/migrations 2>/dev/null || true)" ]; then
  echo "==> Archiving existing migrations to supabase/_archive_migrations_${STAMP}/"
  git mv supabase/migrations/* "supabase/_archive_migrations_${STAMP}/" 2>/dev/null || true
fi
git add -A
git commit -m "chore(supabase): archive legacy migrations (pre fresh-sync)" || true

# Link live project and pull schema
echo "==> Linking Supabase project"
supabase link --project-ref "$PROJECT_REF"

echo "==> Pulling live schema into supabase/schema.sql"
supabase db pull
git add supabase/schema.sql
git commit -m "chore(supabase): pull live schema.sql from prod (baseline)" || true

# Download deployed Edge Functions
echo "==> Downloading deployed Edge Functions from prod"
mkdir -p supabase/functions
supabase functions list -o json | jq -r '.[].slug' | while read -r f; do
  [ -n "$f" ] || continue
  echo "   - $f"
  supabase functions download "$f" --yes
done
git add supabase/functions/** 2>/dev/null || true
git commit -m "chore(edge): download deployed edge functions from prod" || true

# Baseline marker migration
echo "==> Writing baseline no-op migration"
mkdir -p supabase/migrations
MIG="supabase/migrations/$(date +%Y%m%d%H%M%S)_baseline_noop.sql"
echo "-- Baseline marker (live schema synced on $(date -u +"%Y-%m-%dT%H:%M:%SZ"))" > "$MIG"
git add "$MIG"
git commit -m "chore(supabase): add baseline no-op migration" || true

echo "==> Done. Recent commits:"
git --no-pager log --oneline -n 6

echo
echo "Artifacts:"
echo " - supabase/schema.sql"
echo " - supabase/functions/*"
echo " - supabase/_archive_migrations_${STAMP}/"
echo " - ${MIG}"
echo
echo "Next:"
echo " 1) Push branch:     git push -u origin $BRANCH"
echo " 2) When ready for local DB rebuild (Docker + psql), tell me and I’ll give you the command."
