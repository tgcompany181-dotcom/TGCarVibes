#!/usr/bin/env bash
# Turns on email alerts for new booking requests (Gmail + Google app password).
# Usage on the VPS:  ./deploy/setup-email.sh you@gmail.com
set -euo pipefail
cd "$(dirname "$0")/.."
EMAIL="${1:-}"
[ -n "$EMAIL" ] || read -rp "Gmail address: " EMAIL
read -rsp "Google app password (16 letters, hidden while typing): " PASS; echo
PASS="${PASS// /}"
if [ ${#PASS} -lt 16 ]; then echo "!!! The app password should be 16 letters. Please try again."; exit 1; fi
touch .env.local
sed -i '/^SMTP_/d;/^NOTIFY_EMAIL=/d' .env.local
printf 'SMTP_USER=%s\nSMTP_PASS=%s\nNOTIFY_EMAIL=%s\n' "$EMAIL" "$PASS" "$EMAIL" >> .env.local
chmod 600 .env.local
pm2 restart tgcarvibes --update-env >/dev/null
echo "=== Email alerts are on for $EMAIL ==="
echo "Now open Admin -> Settings -> 'Send a test email'."
