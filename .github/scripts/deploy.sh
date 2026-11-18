#!/usr/bin/env bash
set -Eeuo pipefail

echo "========================================"
echo " Iniciando despliegue de RutaGo Backend"
echo "========================================"
cd "$HOME/backend"
echo "→ Actualizando repositorio..."
git pull --ff-only origin main
echo "→ Verificando variables de entorno..."
if ! grep -q "CORS_ORIGIN" .env 2>/dev/null; then
  echo "CORS_ORIGIN=https://rutago.seminario1.eleueleo.com" >> .env
  echo "  ✓ CORS_ORIGIN agregado al .env"
else
  echo "  ✓ CORS_ORIGIN ya existe en .env"
fi
if ! grep -q "JWT_SECRET" .env 2>/dev/null; then
  echo "❌ Falta JWT_SECRET en .env. Genera y rota la clave manualmente antes de desplegar."
  exit 1
else
  echo "  ✓ JWT_SECRET ya existe en .env (no se modifica)"
fi
if ! grep -q "MYSQL_DB" .env 2>/dev/null; then
  echo "⚠️  Faltan las variables MYSQL_* en .env. El script de migración MySQL→PG no podrá conectarse."
  echo "    Agrégalas manualmente en $HOME/backend/.env:"
  echo "    MYSQL_HOST=localhost"
  echo "    MYSQL_PORT=3306"
  echo "    MYSQL_USER=semi1_rutago"
  echo "    MYSQL_PASSWORD=<tu_password>"
  echo "    MYSQL_DB=semi1_rutago_prod"
else
  echo "  ✓ MYSQL_* ya existen en .env"
fi
echo "→ Instalando dependencias..."
npm ci --include=dev
echo "→ Ejecutando migraciones de producción (estructura + catálogos)..."
export NODE_ENV=production
npx sequelize-cli db:migrate --env production
echo "→ Migrando datos históricos desde MySQL (si está disponible)..."
node scripts/migrate-mysql-to-pg.js
echo "→ Eliminando dependencias de desarrollo..."
npm prune --omit=dev
echo "→ Reiniciando únicamente RutaGo Backend..."
sudo -n /usr/bin/systemctl restart rutago.service
echo "→ Verificando estado de rutago.service..."
if ! /usr/bin/systemctl is-active --quiet rutago.service; then
    echo "❌ El servicio rutago.service no quedó activo."
    /usr/bin/systemctl status rutago.service \
        --no-pager \
        --full || true
    exit 1
fi
echo "✅ rutago.service se encuentra activo."
echo "✅ Despliegue finalizado correctamente."
