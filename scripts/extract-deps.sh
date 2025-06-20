#!/bin/bash
set -euo pipefail

# Extract archived node_modules for each workspace if they are not already present.
# Supported archive formats: .tar.gz, .tgz and .zip.

WORKSPACES=(storefronts smoothr)

for ws in "${WORKSPACES[@]}"; do
  if [ ! -d "$ws" ]; then
    echo "Workspace $ws not found" >&2
    continue
  fi

  if [ -d "$ws/node_modules" ]; then
    echo "node_modules already present in $ws" >&2
    continue
  fi

  found=""
  for ext in tar.gz tgz zip; do
    archive="$ws/node_modules.$ext"
    if [ -f "$archive" ]; then
      found="$archive"
      break
    fi
  done

  if [ -z "$found" ]; then
    echo "No archived node_modules found for $ws" >&2
    continue
  fi

  echo "Extracting $found to $ws" >&2
  case "$found" in
    *.tar.gz|*.tgz)
      tar -xzf "$found" -C "$ws"
      ;;
    *.zip)
      unzip -q "$found" -d "$ws"
      ;;
  esac

done
