#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: sh scripts/backup.sh /secure/path/backup.sqlite" >&2
  exit 2
fi
destination=$1
umask 077
# Noclobber prevents overwriting an existing backup. Delete partial output on failure.
if ! (set -C; : > "$destination") 2>/dev/null; then
  echo "Cannot create backup; check the path and ensure it does not already exist." >&2
  exit 1
fi
complete=false
trap 'if [ "$complete" != true ]; then rm -f -- "$destination"; fi' EXIT
if ! docker compose exec -T app node scripts/backup.mjs > "$destination"; then
  echo "Backup failed; partial output removed." >&2
  exit 1
fi
complete=true
echo "Backup created: $destination"
