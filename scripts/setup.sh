#!/bin/sh
set -eu

# One-time setup for a single public HTTPS domain. Never replace existing config.
if [ "$#" -ne 2 ]; then
  echo "Usage: sh scripts/setup.sh DOMAIN CONTACT_EMAIL" >&2
  exit 2
fi
domain=$1
contact=$2
case "$domain" in
  ''|.*|*.|*..*|*[!A-Za-z0-9.-]*) echo "Invalid domain." >&2; exit 2 ;;
  *.*) ;;
  *) echo "Use a public domain such as meeting.example.org." >&2; exit 2 ;;
esac
case "$contact" in
  ''|*[!A-Za-z0-9.@_%+-]*|*@*@*|@*|*@) echo "Invalid contact email." >&2; exit 2 ;;
  *@*.*) ;;
  *) echo "Enter a contact email." >&2; exit 2 ;;
esac
if [ -e .env ]; then
  echo ".env already exists. Keeping it unchanged." >&2
  exit 1
fi
command -v openssl >/dev/null 2>&1 || { echo "Install openssl first." >&2; exit 1; }
umask 077
tmp=$(mktemp ./.env.tmp.XXXXXX)
trap 'rm -f "$tmp"' EXIT HUP INT TERM
code=$(openssl rand -hex 24)
printf 'APP_ORIGIN=https://%s\nSITE_DOMAIN=%s\nAUTH_MODE=demo\nDEMO_ACCESS_CODE=%s\nRETENTION_DAYS=30\nPRIVACY_CONTACT=%s\n' "$domain" "$domain" "$code" "$contact" > "$tmp"
# A hard link fails atomically if another process created .env meanwhile.
if ! ln "$tmp" .env; then
  echo "Could not create .env; any existing configuration was not changed." >&2
  exit 1
fi
echo "Created .env with a unique demo access code and restricted permissions."
echo "Find the code in .env and share it privately with invited participants."
echo "Next: docker compose up -d --build --wait"
