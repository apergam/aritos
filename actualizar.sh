#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/adrians/dev/apps/aritos"
SERVICE="aritos"

echo "========================================"
echo "  Actualizando: $SERVICE"
echo "========================================"
cd "$APP_DIR"

echo "[1/4] Descargando últimos cambios de Git..."
git pull

echo "[2/4] Instalando dependencias (pnpm)..."
pnpm install

echo "[3/4] Compilando assets y bundles..."
pnpm run build

echo "[4/4] Reiniciando servicio systemd ($SERVICE)..."
sudo systemctl restart "$SERVICE"

echo "----------------------------------------"
sudo systemctl status "$SERVICE" --no-pager
echo "========================================"
echo "  ✅ $SERVICE actualizado con éxito!"
echo "========================================"
