#!/usr/bin/env bash
# Pull the latest code, rebuild and restart. Run from the project folder on the VPS.
set -euo pipefail
cd "$(dirname "$0")/.."
git pull
npm ci
npm run build
pm2 reload ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs
pm2 save
