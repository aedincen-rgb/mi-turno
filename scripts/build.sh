#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  scripts/build.sh — build de producción sin tooling
#  Concatena todos los .js locales en un solo app.js y genera
#  un index.html que carga 1 script en vez de 50+.
#
#  Uso: ./scripts/build.sh
#  Salida: dist/ (lista para deploy)
#
#  Sin dependencias: solo bash + cat + sed.
# ════════════════════════════════════════════════════════════════
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "🔨 Mi Turno · Build de producción"
echo ""

# ── 1. Preparar dist/ ──────────────────────────────────────────
rm -rf dist
mkdir -p dist

# Copiar assets estáticos tal cual
echo "📁 Copiando assets..."
cp -r css        dist/
cp -r img        dist/
cp -r icon-*.png dist/ 2>/dev/null || true
cp    manifest.json  dist/
cp    sw.js          dist/
cp    version.json   dist/
cp    vercel.json    dist/
cp    sitemap.xml    dist/ 2>/dev/null || true
cp    robots.txt     dist/ 2>/dev/null || true

# ── 2. Concatenar JS locales en orden ──────────────────────────
echo "📦 Concatenando JS..."

# Lista de archivos en el orden exacto de index.html
# (extraído de los comentarios <!-- X. Nombre --> en index.html)
JS_FILES=(
  # 0. Scripts del head (deben ejecutar antes que todo)
  js/config.js
  js/theme-boot.js

  # 1. Config inicial
  js/config/react-init.js
  js/config/env.js
  js/config/viewport-fix.js
  js/config/globals.js

  # 2. Utilidades
  js/utils/storage.js
  js/utils/format.js
  js/utils/haptic.js
  js/utils/error-logger.js
  js/utils/network.js
  js/utils/uuid.js
  js/utils/icons.js
  js/utils/festivos.js
  js/utils/time.js
  js/utils/validation.js
  js/utils/otp.js
  js/utils/password-hash.js

  # 3. Servicios
  js/services/supabase.js
  js/services/supabase-init.js
  js/services/error-logger.js
  js/services/session-sync.js
  js/services/calculator.js
  js/services/quincena.js
  js/services/data.js
  js/services/backup.js
  js/services/ai-nlp.js
  js/services/ai.js
  js/services/export-files.js
  js/services/export-email.js
  js/services/ai-history.js
  js/services/ai-greeting.js

  # 4. Tabs
  js/tabs/home.js
  js/tabs/dashboard.js
  js/tabs/assistant.js
  js/tabs/history.js
  js/tabs/config.js
  js/tabs/sync-queue.js

  # 5. Modales
  js/modals/error-viewer.js
  js/modals/splash.js
  js/modals/email-compose-card.js
  js/modals/forgot-password.js
  js/modals/forgot-pin.js
  js/modals/pin-setup.js
  js/modals/manage-account.js
  js/modals/diagnostico.js
  js/modals/asignar-pins.js
  js/modals/usuarios.js
  js/modals/export-report.js

  # 6. App top-level
  js/app/auth-screen.js
  js/app/fast-pin-screen.js
  js/app/app-main.js
  js/app/root.js
  js/app/sw-register.js
  js/app/init.js
  js/app/install-prompt.js
)

# Contar y validar que todos los archivos existen
TOTAL=0
MISSING=0
for f in "${JS_FILES[@]}"; do
  if [ -f "$f" ]; then
    TOTAL=$((TOTAL + 1))
  else
    echo "  ⚠ Falta: $f"
    MISSING=$((MISSING + 1))
  fi
done

if [ $MISSING -gt 0 ]; then
  echo "❌ Faltan $MISSING archivos. Abortando."
  exit 1
fi

# Concatenar con banner de versión
VER=$(cat version.json | python3 -c "import sys,json; print(json.load(sys.stdin)['v'])" 2>/dev/null || echo "v0")
{
  echo "// ════════════════════════════════════════════════════════════"
  echo "//  MI TURNO · app.js (build de producción)"
  echo "//  Versión: $VER · $(date '+%Y-%m-%d %H:%M')"
  echo "//  Archivos concatenados: $TOTAL"
  echo "//  Generado por scripts/build.sh"
  echo "// ════════════════════════════════════════════════════════════"
  echo ""
  echo "(function(){"
  echo "'use strict';"
  echo ""

  for f in "${JS_FILES[@]}"; do
    echo "// ── $f ──"
    cat "$f"
    echo ""
    echo ""
  done

  echo "})();"
} > dist/app.js

# Tamaño del bundle
SIZE=$(wc -c < dist/app.js)
SIZE_KB=$((SIZE / 1024))
echo "  ✓ $TOTAL archivos → dist/app.js (${SIZE_KB} KB)"

# ── 3. Generar index.html de producción ─────────────────────────
echo "📄 Generando index.html de producción..."

# Extraer todo hasta el inicio de <!-- JS FRAGMENTADO -->
# y reemplazar los scripts locales por un solo <script src="app.js">
python3 -c "
import re

with open('index.html', 'r') as f:
    html = f.read()

# Eliminar scripts locales del head (ya incluidos en app.js)
html = html.replace('<script src=\"js/config.js\"></script>', '')
html = html.replace('<script src=\"js/theme-boot.js\"></script>', '')

# Encontrar el comentario <!-- JS FRAGMENTADO -->
marker = '<!-- JS FRAGMENTADO -->'
pos = html.find(marker)

if pos == -1:
    print('ERROR: no se encontró el marcador JS FRAGMENTADO en index.html')
    exit(1)

# Parte antes del marcador (head + CDNs + splash + body hasta el marker)
head = html[:pos + len(marker)]

# Cerrar el body
tail = '\n\n</body>\n</html>\n'

# Single script de producción
prod_script = '\n<script src=\"app.js\" defer></script>'

result = head + prod_script + tail

with open('dist/index.html', 'w') as f:
    f.write(result)

print('  ✓ dist/index.html generado')
"

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║  ✅ Build completado                   ║"
echo "║  📦 app.js: ${SIZE_KB} KB ($TOTAL archivos)      ║"
echo "║  📁 dist/ lista para deploy            ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "  Probar localmente:  cd dist && python3 -m http.server 8000"
echo "  Deploy en Vercel:   vercel dist/ --prod"
