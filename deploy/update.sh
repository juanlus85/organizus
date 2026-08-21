#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/organizus}"
SERVICE_NAME="${SERVICE_NAME:-organizus}"

cd "$APP_DIR"
git fetch origin main
git pull --ff-only origin main
corepack enable
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm build
sudo systemctl restart "$SERVICE_NAME"
sudo systemctl status "$SERVICE_NAME" --no-pager
